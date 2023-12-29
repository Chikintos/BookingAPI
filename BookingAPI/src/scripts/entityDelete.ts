import { logger } from "../configs/logger_config";
import { AppDataSource } from "../data-source";
import { Event } from "../entity/event";
import { photo_event } from "../entity/photo_event";
import { photo_venue } from "../entity/photo_venue";
import { Venue } from "../entity/venue";
import { deleteFileAWS } from "./aws_s3";

const venueRepository = AppDataSource.getRepository(Venue);
const venuePhotoRepository = AppDataSource.getRepository(photo_venue);
const eventPhotoRepository = AppDataSource.getRepository(photo_event);

const eventRepository = AppDataSource.getRepository(Event);

// const venuePhotoRepository = AppDataSource.getRepository(photo_venue)

export async function deleteVenueCascase(id: number): Promise<void> {
  const venue: Venue = await venueRepository.findOne({
    where: { id },
    relations: { photos: true, events: true },
  });
  try {
    for (const event of venue.events) {
      await deleteEventCascase(event.id);
      console.log(event.id, " event droped");
    }
    for (const photo of venue.photos) {
      const { image_key } = photo;
      await deleteFileAWS(image_key);
      await venuePhotoRepository.remove(photo);
      console.log(image_key, "droped");
    }
    venueRepository.remove(venue);
  } catch (err) {
    logger.log({
      level: "error",
      message: `${err.message} |params: id=${id}| Error stack: ${err.stack}`,
    });
  }
}

export async function deleteEventCascase(id: number): Promise<void> {
  const event = await eventRepository.findOne({
    where: { id },
    relations: { photos: true },
  });
  try {
    for (const photo of event.photos) {
      const { image_key } = photo;
      await deleteFileAWS(image_key);
      await eventPhotoRepository.remove(photo);
      console.log(image_key, "droped");
    }
    eventRepository.remove(event);
  } catch (err) {
    logger.log({
      level: "error",
      message: `${err.message} |params: id=${id}| Error stack: ${err.stack}`,
    });
  }
}
