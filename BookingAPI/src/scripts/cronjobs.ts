import { AppDataSource } from "../data-source";
import { Venue } from "../entity/venue";
import { User } from "../entity/user";
import { Review } from "../entity/review";
import { MoreThanOrEqual } from "typeorm";
import { logger } from "../configs/logger_config";
import Cloudipsp from "cloudipsp-node-js-sdk";
import { Order, orderStatus } from "../entity/order";
import { Event } from "../entity/event";
import { Transaction, transactionStatus } from "../entity/transaction";

const reviewRepository = AppDataSource.getRepository(Review);
const venueRepository = AppDataSource.getRepository(Venue);
const orderRepository = AppDataSource.getRepository(Order);
const eventRepository = AppDataSource.getRepository(Event);
const transactionRepository = AppDataSource.getRepository(Transaction);

export async function updateRate() {
  const fromTime = new Date();
  fromTime.setHours(fromTime.getHours() - 1);
  try {
    const venues = await reviewRepository
      .createQueryBuilder("Review")
      .where("Review.createdDate > :createdDate", {
        createdDate: fromTime.toISOString(),
      })
      .leftJoinAndSelect("Review.venue", "venue")
      .select("venue.id", "id")
      .distinct(true)
      .getRawMany();

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
    logger.log({
      level: "cronjob error",
      message: `${err.message} | Error stack: ${err.stack}`,
    });
  }
}

export async function paymentStatus() {
  const merchantId = process.env.MERCHANT_ID;
  const secretKey = process.env.SECRET_KEY;
  const fondy = new Cloudipsp({
    merchantId,
    secretKey,
  });
  const badStatus = ["expired","reversed","declined"]
  const orderList: Order[] = await orderRepository.find({
    where: { status: orderStatus.WAITING },
  });
  for (const order of orderList){
    const statusData = {
      order_id: `id:${order.id}`,
    };
    fondy.Status(statusData).then(async (data) => {
      const status_response=data.order_status;
      if (badStatus.includes(status_response)){
        const bad_order = await orderRepository.findOne({
          where: { id: order.id },
          relations: { transaction: true },
        });
        bad_order.status=orderStatus.CANCELED
        bad_order.transaction.status=transactionStatus.CANCELED
        await orderRepository.save(bad_order)
        await transactionRepository.save(bad_order.transaction)

      }    
    });
  }


}
