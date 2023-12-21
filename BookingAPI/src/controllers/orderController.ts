import asyncHandler from "express-async-handler";
import { UserRequest } from "../interfaces/UserRequest";
import { Response } from "express";
import { orderCreateSchema } from "../validators/orderValidator";
import { AppDataSource } from "../data-source";
import { Order, orderStatus } from "../entity/order";
import { Transaction, transactionStatus } from "../entity/transaction";
import { User } from "../entity/user";
import { Event } from "../entity/event";
import { createPayment } from "../scripts/scripts";

const userRepository = AppDataSource.getRepository(User);
const orderRepository = AppDataSource.getRepository(Order);
const eventRepository = AppDataSource.getRepository(Event);
const transactionRepository = AppDataSource.getRepository(Transaction);

export const createOrder = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { event_id, place_number } = req.body;
    try {
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
      const user: User = await userRepository.findOneBy({ id: req.user.id });
      const event: Event = await eventRepository.findOneBy({ id: event_id });

      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }
      if (!event) {
        res.status(404);
        throw new Error("Event not found");
      }
      //   CHECK FOR PLACES
      const amount: number = event.price * place_number;

      const new_transaction : Transaction = await transactionRepository.create({
        payment_card: user.pay_card,
      });
      await transactionRepository.save(new_transaction);

      const order : Order = await orderRepository.create({
        amount,
        place_number,
        transaction:new_transaction,
        user,
        event
      })
      await orderRepository.save(order)
      const order_desc= `Придбання ${order.place_number} квитків для ${order.user.email} на ${order.event.name}`
      const payment = await createPayment(order,order_desc)
      res.json(payment)
    } catch (err) {
      if (res.statusCode === 200) {
        res.status(500);
      }
      throw new Error(err.message);
    }
  }
);




export const checkCallback = asyncHandler(
    async (req: UserRequest, res: Response) => {
        const badStatus = ["expired","reversed","declined"]

        const {order_status,order_id} = req.body
        const order = await orderRepository.findOne({where: {id:order_id.replace("id:", "")},relations:{transaction:true}})
        console.log(req.body,order)
        if (order_status in badStatus){
            order.status=orderStatus.CANCELED
            order.transaction.status=transactionStatus.CANCELED
        }        
        else if(order_status === "approved") {
            order.status=orderStatus.SUCCESSFUL
            order.transaction.status=transactionStatus.SUCCESSFUL
        }
        await orderRepository.save(order)
        await transactionRepository.save(order.transaction)
        

    })