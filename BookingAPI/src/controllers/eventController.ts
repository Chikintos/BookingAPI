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




// Get repositories from the data source
const eventRepository = AppDataSource.getRepository(Event);
const venueRepository = AppDataSource.getRepository(Venue);
const userRepository = AppDataSource.getRepository(User);
const eventPhotoRepository = AppDataSource.getRepository(photo_event);

// Handler for creating an event
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
      // Validate the request data
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

      // Create a new event
      let new_event: Event = await eventRepository.create({
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
      new_event = await eventRepository.save(new_event);
      res.json({ event_id: new_event.id });
    } catch (err) {
      if (res.statusCode === 200) {
        res.status(500);
      }
      throw new Error(err.message);
    }
  }
);

// Handler for getting an event by ID
export const eventGet = asyncHandler(
  async (req: UserRequest, res: Response) => {
    // Extract event ID from the request parameters
    const event_id: number = parseInt(req.params.id);

    if (!event_id){
     res.status(400)
     throw new Error("event id invalid") 
    }

    // Get user information from the token
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

    // If the user is not an admin, remove the created_by field from the response
    if (user?.role !== UserRole.ADMIN) {
      delete Event["created_by"];
    }

    res.status(200).json(Event);
  }
);

// Handler for updating an event
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
      // Validate the update request data
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
      
      if (!event) {
        res.status(404);
        throw new Error("event not found");
      }
      const user = await userRepository.findOneBy({ id: req.user.id });
      
      if (!user) {
        res.status(404);
        throw new Error("user not found");
      }

      // If a new venue ID is provided, find and update the venue
      if (venue_id) {
        venue = await venueRepository.findOneBy({ id: venue_id });
        if (!venue) {
          res.status(404);
          throw new Error("Venue not found");
        }
        event.venue = venue;
      }
      // Update event attributes based on the provided data
      event.name = name || event.name
      event.price = price || event.price;
      event.venue = venue;
      event.date_start = date_start ? new Date(date_start) :event.date_start;
      event.date_end = date_end ? new Date(date_end) : event.date_end;
      event.description = description || event.description;
      event.event_type = event_type || event.event_type;

      await eventRepository.save(event);
      res.status(200).json({ status: "info update" });
    } catch (err) {
      if (res.statusCode === 200) {
        res.status(500);
      }
      throw new Error(err);
    }
  }
);

// Handler for deleting an event
export const eventDelete = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const event_id: number = parseInt(req.params.id);
  
    // Find the event by ID with creator information
    let Event: Event = await eventRepository.findOne({
      where: { id: event_id },
      relations: { created_by: true },
      select: { id: true, created_by: { id: true } },
    });

    // Check if the current user has permission to delete the event
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
      // Perform cascade deletion of the event
      await deleteEventCascase(event_id);
      res.status(200).json({ message: "delete succesfull" });
    } catch (err) {
      res.status(500);
      throw new Error(err);
    }
  }
);

// Handler for getting events created by a user
export const eventGetByUser = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const user_id: number = parseInt(req.params.id);

    // Check if the current user has permission to view events created by the specified user
    if (!(req.user.role === UserRole.ADMIN || req.user.id === user_id)) {
      res.status(403);
      throw new Error("Get this info can only admin or creator");
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
// Handler for adding a photo to an event 
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
      // Check if the event exists and has not reached the maximum photo count
      if (!Event) {
        res.status(404);
        throw new Error("event not found");
      } else if (Event.photos.length > 10) {
        res.status(409);
        throw new Error("maximum photo count is reached");
      }
      // Validate the request data
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
    // Upload the photo to AWS S3
    const result = await uploadFile(photo);
    fs.unlinkSync(photo.path);

    // Create a new photo event entity
    let photo_event = await eventPhotoRepository.create({
      description,
      image_key: photo.filename,
      event: Event,
    });
    photo_event = await eventPhotoRepository.save(photo_event);
    res.json({ image_key: photo_event.image_key });
  }
);

// Handler for getting photos of an event
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
    // Get the list of photos for the event
    const photo_list = await eventPhotoRepository.find({
      where: { event },
    });
    res.status(200).json({ photo_list });
  }
);


// Handler for deleting a photo from an event
export const eventDeletePhoto = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const eventPhoto_id: number = parseInt(req.params.id);
    if (!eventPhoto_id) {
      res.status(400);
      throw new Error("id invaid");
    }

    // Find the photo event by ID with related information
    const Photo = await eventPhotoRepository.findOne({
      where: { id: eventPhoto_id },
      relations: ["event", "event.created_by"],
    });

    // Check if the user has the rights to delete the photo
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
    // Delete the photo from AWS S3
    deleteFileAWS(Photo.image_key);
    await eventPhotoRepository.remove(Photo);
    res.status(200).json({ status: "photo delete succesfull" });
  }
);

// Handler for searching events based on specified criteria
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
    // Extract pagination parameters
    const skip: number = parseInt(req.query.skip) || 0;
    const take: number = parseInt(req.query.take) || 10;
    try {
      // Validate search criteria
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

      // Create a query builder for events
      const EventsQuery = eventRepository.createQueryBuilder("event");

      // Apply search criteria to the query
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
      // Apply pagination parameters
      EventsQuery.skip(skip).take(take);
    // Execute the query and get the results
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
