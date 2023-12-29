import { Response } from "express";
import { UserRequest } from "../interfaces/UserRequest";
import asyncHandler from "express-async-handler";
import {
  eventCreateSchema,
  eventSearchSchema,
  eventUpdateSchema,
} from "../validators/eventValidator";
import { AppDataSource } from "../data-source";
import { Event } from "../entity/event";
import { Venue } from "../entity/venue";
import jsonwebtoken from "jsonwebtoken";
import { User, UserRole } from "../entity/user";
import { deleteEventCascase } from "../scripts/entityDelete";
import { AddPhotoSchema } from "../validators/venueValidator";
import fs from "fs";
import { photo_event } from "../entity/photo_event";
import { deleteFileAWS, uploadFile } from "../scripts/aws_s3";
import { token_info } from "../scripts/scripts";
import { UserTokenInfo } from "../interfaces/UserTokenInfo";
import { number } from "yup";
import { QueryBuilder } from "typeorm";

const eventRepository = AppDataSource.getRepository(Event);
const venueRepository = AppDataSource.getRepository(Venue);
const userRepository = AppDataSource.getRepository(User);
const eventPhotoRepository = AppDataSource.getRepository(photo_event);

export const eventCreate = asyncHandler(
  async (req: UserRequest, res: Response) => {
    let {
      name,
      price,
      date_start,
      date_end,
      description,
      event_type,
      available_places,
      venue_id,
    } = req.body;

    try {
      await eventCreateSchema.validate({
        role: req.user.role,
        venue_id,
        name,
        price,
        date_start,
        date_end,
        description,
        available_places,
        event_type,
      });
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }

    try {
      const Venue = await venueRepository.findOneBy({ id: venue_id });
      const user = await userRepository.findOneBy({ id: req.user.id });
      if (!Venue) {
        res.status(404);
        throw new Error("Venue not found");
      }
      if (!available_places) {
        available_places = Venue.capacity;
      }
      const new_event: Event = await eventRepository.create({
        name,
        price,
        date_start: new Date(date_start),
        date_end: new Date(date_end),
        description,
        event_type,
        venue: Venue,
        available_places,
        created_by: user,
      });
      await eventRepository.save(new_event);
      res.status(200).json({ event_id: new_event.id });
    } catch (err) {
      if (res.statusCode === 200) {
        res.status(500);
      }
      throw new Error(err);
    }
  }
);

export const eventGet = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const event_id: number = parseInt(req.params.id);
    let user: UserTokenInfo = await token_info(req);
    let Event: Event = await eventRepository.findOne({
      where: { id: event_id },
      relations: { created_by: true },
      select: { created_by: { id: true } },
    });
    if (!Event) {
      res.status(404);
      throw new Error("event not found");
    }
    if (user?.role !== UserRole.ADMIN) {
      delete Event["created_by"];
    }

    res.status(200).json(Event);
  }
);

export const eventUpdate = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const {
      name,
      price,
      date_start,
      date_end,
      description,
      event_type,
      venue_id,
    } = req.body;
    const event_id: number = parseInt(req.params.id);
    let venue: Venue;

    try {
      await eventUpdateSchema.validate({
        role: req.user.role,
        venue_id,
        event_id,
        name,
        price,
        date_start,
        date_end,
        description,
        event_type,
      });
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }
    try {
      const event = await eventRepository.findOne({
        where: { id: event_id },
        relations: { venue: true },
      });
      const user = await userRepository.findOneBy({ id: req.user.id });
      if (!user) {
        res.status(404);
        throw new Error("user not found");
      }

      if (venue_id) {
        venue = await venueRepository.findOneBy({ id: venue_id });
        if (!venue) {
          res.status(404);
          throw new Error("Venue not found");
        }
        event.venue = venue;
      }
      if (!event) {
        res.status(404);
        throw new Error("event not found");
      }

      if (name) {
        event.name = name;
      }
      if (price) {
        event.price = price;
      }
      if (price) {
        event.venue = venue;
      }
      if (date_start) {
        event.date_start = new Date(date_start);
      }
      if (date_end) {
        event.date_end = new Date(date_end);
      }
      if (description) {
        event.description = description;
      }
      if (event_type) {
        event.event_type = event_type;
      }

      await eventRepository.save(event);
      res.status(200).json({ message: "changed" });
    } catch (err) {
      if (res.statusCode === 200) {
        res.status(500);
      }
      throw new Error(err);
    }
  }
);

export const eventDelete = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const event_id: number = parseInt(req.params.id);

    let Event: Event = await eventRepository.findOne({
      where: { id: event_id },
      relations: { created_by: true },
      select: { id: true, created_by: { id: true } },
    });

    if (
      req.user.id !== Event.created_by.id &&
      req.user.role !== UserRole.ADMIN
    ) {
      res.status(403);
      throw new Error("Delete can only admin or creator");
    }
    if (!Event) {
      res.status(404);
      throw new Error("event not found");
    }

    try {
      await deleteEventCascase(event_id);
      res.status(200).json({ message: "delete succesfull" });
    } catch (err) {
      res.status(500);
      throw new Error(err);
    }
  }
);

export const eventGetByUser = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const user_id: number = parseInt(req.params.id);

    if (!(req.user.role === UserRole.ADMIN || req.user.id === user_id)) {
      res.status(403);
      throw new Error("Delete can only admin or creator");
    }
    const organizator: User = await userRepository.findOneBy({
      id: user_id,
    });
    if (!organizator) {
      res.status(404);
      throw new Error("user not found");
    }

    let Event: Event[] = await eventRepository.find({
      where: { created_by: organizator },
      relations: { created_by: true },
      select: { created_by: { id: true } },
    });
    res.status(200).json(Event);
  }
);

export const eventAddPhoto = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const photo = req.file;
    const { description } = req.body;
    const event_id: number = parseInt(req.params.id);

    const Event = await eventRepository.findOne({
      where: { id: event_id },
      relations: { photos: true },
    });
    try {
      if (!Event) {
        res.status(404);
        throw new Error("event not found");
      } else if (Event.photos.length > 10) {
        res.status(409);
        throw new Error("maximum photo count is reached");
      }
      await AddPhotoSchema.validate({
        photo,
        role: req.user.role,
        id: event_id,
        description,
      });
    } catch (err) {
      res.status(400);
      fs.unlinkSync(photo.path);
      throw new Error(err.message);
    }
    const result = await uploadFile(photo);
    fs.unlinkSync(photo.path);
    let photo_event = await eventPhotoRepository.create({
      description,
      image_key: photo.filename,
      event: Event,
    });
    const photo_result = await eventPhotoRepository.save(photo_event);
    res.json({ image_key: photo_result.image_key });
  }
);

export const eventGetPhoto = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const event_id: number = parseInt(req.params.id);
    if (!event_id) {
      res.status(400);
      throw new Error("id invaid");
    }
    const event = await eventRepository.findOne({
      where: { id: event_id },
    });
    if (!event) {
      res.status(404);
      throw new Error("Event not found");
    }
    const photo_list = await eventPhotoRepository.find({
      where: { event },
    });
    res.status(200).json({ photo_list });
  }
);

export const eventDeletePhoto = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const eventPhoto_id: number = parseInt(req.params.id);
    if (!eventPhoto_id) {
      res.status(400);
      throw new Error("id invaid");
    }

    const Photo = await eventPhotoRepository.findOne({
      where: { id: eventPhoto_id },
      relations: ["event", "event.created_by"],
    });
    if (
      req.user.role !== UserRole.ADMIN ||
      req.user.id === Photo.event.created_by.id
    ) {
      res.status(403);
      throw new Error("you have no rights");
    }
    if (!Photo) {
      res.status(404);
      throw new Error("Photo not found");
    }
    deleteFileAWS(Photo.image_key);
    await eventPhotoRepository.remove(Photo);
    res.status(200).json({ message: "photo delete succesfull" });
  }
);

export const eventSearch = asyncHandler(
  async (req: UserRequest, res: Response) => {
    let {
      address,
      name,
      price_min,
      date_start,
      price_max,
      date_end,
      event_type,
    } = req.query;
    console.log(date_start);
    const skip: number = parseInt(req.query.skip) || 0;
    const take: number = parseInt(req.query.take) || 10;
    try {
      await eventSearchSchema.validate({
        skip,
        take,
        address,
        name,
        price_min,
        date_start,
        price_max,
        date_end,
        event_type,
      });

      const EventsQuery = eventRepository.createQueryBuilder("event");
      if (name) {
        EventsQuery.andWhere("event.name ILIKE :q", { q: `%${name}%` });
      }
      if (address) {
        EventsQuery.leftJoinAndSelect("event.venue", "venue").andWhere(
          "venue.address ILIKE :q",
          { q: `%${address}%` }
        );
      }
      if (price_min && price_max) {
        EventsQuery.andWhere("price BETWEEN :price_min AND :price_max", {
          price_min,
          price_max,
        });
      }
      if (date_start && date_end) {
        EventsQuery.andWhere("date BETWEEN :date_start AND :date_end", {
          date_start,
          date_end,
        });
      }

      EventsQuery.skip(skip).take(take);
      const result = await EventsQuery.getMany();
      res.json({ result });
    } catch (err) {
      if (err.name === "ValidationError") {
        res.status(400);
      } else {
        res.status(500);
      }
      throw new Error(err.message);
    }
  }
);
