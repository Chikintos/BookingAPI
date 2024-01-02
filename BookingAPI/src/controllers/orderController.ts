import asyncHandler from "express-async-handler";
import { UserRequest } from "../interfaces/UserRequest";
import { Response } from "express";
import {
  orderByUserSchema,
  orderCreateSchema,
} from "../validators/orderValidator";
import { AppDataSource } from "../data-source";
import { Order, orderStatus } from "../entity/order";
import { Transaction, transactionStatus } from "../entity/transaction";
import { User, UserRole } from "../entity/user";
import { Event } from "../entity/event";
import { createPayment, createRefund, generateQR } from "../scripts/scripts";
import { addContact, emailSendMessage } from "../scripts/email-sender";
import { link, stat } from "fs";

const userRepository = AppDataSource.getRepository(User);
const orderRepository = AppDataSource.getRepository(Order);
const eventRepository = AppDataSource.getRepository(Event);
const transactionRepository = AppDataSource.getRepository(Transaction);

//route handler to create an order
export const createOrder = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { event_id, place_number } = req.body;
    try {
      // Validate order creation schema
      await orderCreateSchema.validate({
        event_id,
        place_number,
        role: req.user.role,
      });
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }

    try {
      const user: User = await userRepository.findOne({
        where: { id: req.user.id },
        relations: { pay_card: true },
      });
      const event: Event = await eventRepository.findOneBy({ id: event_id });
      //calculate the amount for order
      const amount: number = event.price * place_number;
      const current_datetime = new Date();
      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }
      if (!event) {
        res.status(404);
        throw new Error("Event not found");
      }
      if (event.available_places < place_number) {
        throw new Error("Places aren`t avaliable");
      }
      if (event.date_start < current_datetime) {
        throw new Error("event already start");
      }
      if (!user.pay_card) {
        throw new Error("User haven`t card");
      }

      // Create a transaction and an order
      const transaction: Transaction = await transactionRepository.create({
        payment_card: user.pay_card,
      });
      await transactionRepository.save(transaction);

      const order: Order = await orderRepository.create({
        amount,
        place_number,
        transaction,
        user,
        event,
      });
      await orderRepository.save(order);

      // Create payment and respond with payment details
      const order_desc = `Придбання ${order.place_number} квитків для ${order.user.email} на ${order.event.name}`;
      const payment = await createPayment(order, order_desc);
      res.json(payment);
    } catch (err) {
      if (res.statusCode === 200) {
        res.status(500);
      }
      throw new Error(err.message);
    }
  }
);
//route handler to get payment callback
export const checkCallback = asyncHandler(
  async (req: UserRequest, res: Response) => {
    let { order_id } = req.body;
    order_id = order_id.replace("id:", "");

    // Find the order with related information
    const order = await orderRepository.findOne({
      where: { id: order_id },
      relations: { transaction: true, event: { venue: true }, user: true },
    });

    // If the transaction is successful, do nothing
    if (order.transaction.status === transactionStatus.SUCCESSFUL) {
      return;
    }
    // Update order and transaction status to successful
    order.status = orderStatus.SUCCESSFUL;
    order.transaction.status = transactionStatus.SUCCESSFUL;
    order.event.available_places -= order.place_number;

    // Save changes to the database
    await orderRepository.save(order);
    await eventRepository.save(order.event);
    await transactionRepository.save(order.transaction);

    // Generate QR code and send email with ticket details
    const qrcode = await generateQR(
      `${order.event.name}|${order.event.venue.address}|${order.place_number}`
    );
    await emailSendMessage(
      {
        Email: "triathlet.52@gmail.com",
        Name: "sendersss",
      },
      {
        Email: order.user.email,
        Name: order.user.firstName,
      },
      {
        message_type: "ticket",
        base64photo: qrcode,
        data: {
          event_name: order.event.name,
          places_number: order.place_number,
          owner_email: order.user.email,
          event_location: order.event.venue.address,
          link: "linkdsadasd",
        },
      }
    );
  }
);


//route handler to cancel an order
export const cancelOrder = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const order_id: number = +req.params.id;
    const current_datetime = new Date();

    // Find the order with related information
    const order = await orderRepository.findOne({
      where: { id: order_id },
      relations: { transaction: true, event: true, user: true },
    });

    // Check user's rights to cancel the order
    if (order.user.id != req.user.id && req.user.role !== UserRole.ADMIN) {
      res.status(403);
      throw new Error("You haven`t rights for this action");
    }

    // If the transaction is successful, create a refund
    if (order.transaction.status === transactionStatus.SUCCESSFUL) {
      await createRefund(order);
      return;
    }

    // Check if the event has already started
    if (order.event.date_start < current_datetime) {
      throw new Error("event already start");
    }

    // Update order and transaction status to canceled
    order.status = orderStatus.CANCELED;
    order.transaction.status = transactionStatus.CANCELED;

    // Save changes to the database
    await orderRepository.save(order);
    await transactionRepository.save(order.transaction);

    // Send email notification about the order cancellation
    const link: string = `${process.env.URL}/api/order/${order.id}`;
    await emailSendMessage(
      { Email: "triathlet.52@gmail.com", Name: "bestEvent" },
      {
        Email: order.user.email,
        Name: order.user.firstName,
      },
      {
        message_type: "emailNotification",
        data: { code: "10", text: "Order was succesfully canceled", link },
      }
    );
    res.status(200).json({ status: "order canceled" });
  }
);

//route handler to get orders by user
export const getOrderByUser = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const user_id: number = +req.params.id;
    let { status, skip } = req.body;
    try {
      await orderByUserSchema.validate({
        user_id,
        status,
        skip,
      });
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }
    if (status === "all") {
      status = null;
    }
    status === "all" ? (status = null) : status;

    // Find the user and retrieve orders based on specified criteria
    const user: User = await userRepository.findOneBy({ id: user_id });
    const orders = await orderRepository.findAndCount({
      where: { user: { id: user_id }, status },
      skip,
      take: 10,
    });
    res.json(orders);
  }
);

//handler to get a specific order
export const getOrder = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const order_id: number = +req.params.id;

    // Find the order with related information
    const order = await orderRepository.findOne({
      where: { id: order_id },
      relations: { transaction: true, event: { venue: true }, user: true },
      select: {
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone_number: true,
        },
        event: {
          id: true,
          name: true,
          date_start: true,
          date_end: true,
          event_type: true,
          venue: {
            id: true,
            name: true,
            address: true,
            capacity: true,
            rate: true,
          },
        },
      },
    });

    // Check user's rights to view the order
    if (order.user.id !== req.user.id && req.user.role !== UserRole.ADMIN) {
      res.status(403);
      throw new Error("You haven`t rights for this action");
    }
    res.status(200).json(order);
  }
);
