import { AppDataSource } from "../data-source";
import { Venue } from "../entity/venue";
import { User } from "../entity/user";
import { Review } from "../entity/review";
import { MoreThanOrEqual } from "typeorm";
import { logger_cronjob } from "../configs/logger_config";
import Cloudipsp from "cloudipsp-node-js-sdk";
import { Order, orderStatus } from "../entity/order";
import { Event } from "../entity/event";
import { Transaction, transactionStatus } from "../entity/transaction";
import { generateQR } from "./scripts";
import { emailSendMessage } from "./email-sender";

// Import necessary repositories
const reviewRepository = AppDataSource.getRepository(Review);
const venueRepository = AppDataSource.getRepository(Venue);
const orderRepository = AppDataSource.getRepository(Order);
const eventRepository = AppDataSource.getRepository(Event);
const transactionRepository = AppDataSource.getRepository(Transaction);

// Function to update the average rate of venues
export async function updateRate() {
  const fromTime = new Date();
  // Set the time from which to fetch reviews (last 1 hour)
  fromTime.setHours(fromTime.getHours() - 1);
  try {
    // Fetch venues with new reviews
    const venues = await reviewRepository
      .createQueryBuilder("Review")
      .where("Review.createdDate > :createdDate", {
        createdDate: fromTime.toISOString(),
      })
      .leftJoinAndSelect("Review.venue", "venue")
      .select("venue.id", "id")
      .distinct(true)
      .getRawMany();
    // Update the rate for each venue
    for (const venue of venues) {
      let rate = await reviewRepository
        .createQueryBuilder("Review")
        .where("Review.venue.id = :venue_id", { venue_id: venue.id })
        .select("AVG(Review.rate)", "avarage")
        .getRawOne();
      rate = Math.ceil(rate.avarage * 10) / 10;
      const venueUp: Venue = await venueRepository.findOneBy({ id: venue.id });
      venueUp.rate = rate;

      await venueRepository.save(venueUp);
    }
  } catch (err) {
    // Log any errors during the process
    logger_cronjob.log({
      level: "cronjob",
      message: `${err.message} | Error stack: ${err.stack}`,
    });
  }
}

// Function to check and update payment statuses
export async function paymentStatus() {
  const merchantId = process.env.MERCHANT_ID;
  const secretKey = process.env.SECRET_KEY;
  try{
  const fondy = new Cloudipsp({
    merchantId,
    secretKey,
  });
  // Define bad order statuses
  const badStatus = ["expired", "reversed", "declined"];    
  
  // Fetch orders with waiting status
  const orderList: Order[] = await orderRepository.find({
    where: [{ status: orderStatus.WAITING }],
  });
  
  // Iterate over each order and check the payment status
  for (const order of orderList) {
    const statusData = {
      order_id: `id:${order.id}`,
    };
    // Use Fondy API to get order status
    fondy.Status(statusData).then(async (data) => {
      const status_response = data.order_status;
      
      // Handle bad statuses
      if (badStatus.includes(status_response)) {
        const bad_order = await orderRepository.findOne({
          where: { id: order.id },
          relations: { transaction: true,user:true },
        });
        bad_order.status = orderStatus.CANCELED;
        bad_order.transaction.status = transactionStatus.CANCELED;
        await orderRepository.save(bad_order);
        await transactionRepository.save(bad_order.transaction);

        const link: string = `${process.env.URL}/api/order/${bad_order.id}` 
        await emailSendMessage(
          {
            Email: "",
            Name: "",
          },
          {
            Email: bad_order.user.email,
            Name: bad_order.user.firstName,
          },
          { message_type: "emailNotification", data: { code: "10", text: "Order was not payed", link } }
        );
      }
      // Handle successful payment
      if (status_response === "approved") {
        const good_order = await orderRepository.findOne({
          where: { id: order.id },
          relations: { transaction: true, event:{venue:true}},
        });
        good_order.status = orderStatus.SUCCESSFUL;
        good_order.transaction.status = transactionStatus.SUCCESSFUL;
        good_order.event.available_places -= order.place_number;
        await orderRepository.save(good_order);
        await eventRepository.save(good_order.event);
        await transactionRepository.save(good_order.transaction);
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
    });
  }}catch(err){
    // Log any errors during the process
    logger_cronjob.log({
      level: "cronjob",
      message: `${err.message} | Error stack: ${err.stack}`,
    });
  }
}
