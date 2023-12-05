import { AppDataSource } from "../data-source";
import { Venue } from "../entity/venue";
import { User } from "../entity/user";
import { Review } from "../entity/review";
import { MoreThanOrEqual } from "typeorm";
import { logger } from "../configs/logger_config";

const reviewRepository = AppDataSource.getRepository(Review);
const venueRepository = AppDataSource.getRepository(Venue);

export async function updateRate() {
  const fromTime = new Date();
  fromTime.setHours(fromTime.getHours() - 1);
    try{
    const venues = await reviewRepository
      .createQueryBuilder('Review')
      .where("Review.createdDate > :createdDate", { createdDate: fromTime.toISOString() })
      .leftJoinAndSelect('Review.venue', 'venue')
      .select('venue.id', 'id')
      .distinct(true)
      .getRawMany();
    
    for (const venue of venues){

      let rate = await reviewRepository
      .createQueryBuilder("Review").where("Review.venue.id = :venue_id",{venue_id:venue.id})
      .select('AVG(Review.rate)',"avarage")
      .getRawOne()
      rate  = Math.ceil(rate.avarage*10)/10
      const venueUp : Venue = await venueRepository.findOneBy({id:venue.id})
      venueUp.rate = rate

      await venueRepository.save(venueUp)
    }
  }catch(err) {
    logger.log({level:"cronjob error",message:`${err.message} | Error stack: ${err.stack}`})
  }

}
