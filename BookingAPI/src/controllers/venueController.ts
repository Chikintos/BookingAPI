import { AppDataSource } from "../data-source";
import { UserRole } from "../entity/user";
import { venue } from "../entity/venue";
import { photo_venue } from "../entity/photo_venue";
import fs  from "fs";

import asyncHandler from "express-async-handler";
import * as EmailValidator from "email-validator";
import exress, { Router, Request, Response } from "express";
import { UserRequest } from "../interfaces/UserRequest";
import { request } from "http";
import { Not } from "typeorm";
import { deleteFileAWS, uploadFile } from "../scripts/aws_s3";
import { venueCreateSchema, venueUpdateSchema } from "../validators/venueValidator";

const venueRepository = AppDataSource.getRepository(venue);
const venuePhotoRepository = AppDataSource.getRepository(photo_venue);
const phone_regex = /^\+\d{1,4}\(\d{1,5}\)\d{7}/;

export const VenueGet = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const user_id: number = parseInt(req.params.id);
    if (!user_id) {
      res.status(400);
      throw new Error("id invaid");
    }
    if (req.user.role !== UserRole.ADMIN) {
      res.status(403);
      throw new Error("you have no rights");
    }
    const venue = await venueRepository.find({ where: { id: user_id } });
    if (!venue[0]) {
      res.status(404);
      throw new Error("venue not found");
    }
    res.status(200).json({ venue: venue[0] });
  }
);
export const VenueCreate = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { name, address, phone_number, contact_name, capacity, description } =
      req.body;
    try {
      await venueCreateSchema.validate({
        role:req.user.role,
        name,
        address,
        phone_number,
        contact_name,
        capacity,
        description
      });
    } catch (err) {
      res.status(400);
      throw new Error(err.errors.toString());
    }
    const existed_number = await venueRepository.findOne({
      where: { phone_number },
    });
    if (existed_number) {
      res.status(400);
      throw new Error("Venue with this phone number already exists");
    }
    const Venue = await venueRepository.create({
      name,
      address,
      phone_number,
      contact_name,
      capacity,
      description,
    });
    const results = await venueRepository.save(Venue);
    res
      .status(200)
      .json({ message: "venue create succesfull", venue_id: Venue.id });
  }
);

export const VenueUpdate = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const venue_id: number = parseInt(req.params.id);
    const { name, address, phone_number, contact_name, capacity, description } =
      req.body;

      try {
        await venueUpdateSchema.validate({
          venue_id,
          role:req.user.role,
          name,
          address,
          phone_number,
          contact_name,
          capacity,
          description
        });
      } catch (err) {
        res.status(400);
        throw new Error(err.errors.toString());
      }


    const Venue = await venueRepository.findOne({ where: { id: venue_id } });
    if (!Venue) {
      res.status(404);
      throw new Error("Venue not found");
    }

    const existed_number = await venueRepository.findOne({
      where: { phone_number, id: Not(Venue.id) },
    });
    
    if (existed_number) {
      res.status(400);
      throw new Error("Venue with this phone number already exists");
    }

    const new_info = {
      name,
      address,
      phone_number,
      contact_name,
      capacity,
      description,
    };
    await venueRepository.update(Venue.id, new_info);

    res.status(200).json(new_info);
  }
);
export const VenueDelete = asyncHandler(
    async (req: UserRequest, res: Response) => {
      const venue_id: number = parseInt(req.params.id);

      if (!venue_id) {
        res.status(400);
        throw new Error("id invaid");
      }
      if (req.user.role !== UserRole.ADMIN) {
        res.status(403);
        throw new Error("you have no rights");
      }
      const venue = await venueRepository.findOne({ where: { id: venue_id },relations:{photos:true} });
      if (venue.photos){
        venue.photos.forEach(photo => {
          deleteFileAWS(photo.image_key)
        });
      }
      if (!venue) {
        res.status(404);
        throw new Error("venue not found");
      }
      await venueRepository.remove(venue);
      res.status(200).json({ "message":"venue removed succesfull" });
    }
  );



  export const VenueAddPhoto = asyncHandler(
    async (req: UserRequest, res: Response) => {
      const photo = req.file
      const {description} = req.body
      const venue_id: number = parseInt(req.params.id);
      const error = {status:false,text:null}
      if (req.user.role !== UserRole.ADMIN) {
        res.status(403);
        error.status = true
        error.text = "no permission"
      }
      else if (!venue_id) {
        res.status(400);
        error.status = true
        error.text = "no venue id"
      }
      else if (!photo){
        res.status(400)
        error.status = true
        error.text = "photo is empty"
      }
      else if (!description){
        res.status(400)
        error.status = true
        error.text = "description is empty"
      }
      const Venue = await venueRepository.findOne({where:{id:venue_id},relations:{photos:true}})
      if (!Venue){
        res.status(404)
        error.status = true
        error.text = "Venue not found"
      }
      else if  (Venue.photos.length>10){
        res.status(409)
        error.status = true
        error.text = "Photo count is maximum"
      }

      if (error.status){
        fs.unlinkSync(photo.path)
        throw new Error(error.text)
      }
      const result = await uploadFile(photo)
      
      const photo_venue = await venuePhotoRepository.create({
        description,
        image_key:photo.filename,
        venue:Venue
      })
      const photo_result = await venuePhotoRepository.save(photo_venue)
      fs.unlinkSync(photo.path)
      
      res.status(200).json({photo_venue})
    }
  );
  export const VenueGetPhoto = asyncHandler(
    async (req: UserRequest, res: Response) => {
      const venue_id: number = parseInt(req.params.id);
      if (req.user.role !== UserRole.ADMIN) {
        res.status(403);
        throw new Error("you have no rights");
      }
      if (!venue_id) {
        res.status(400);
        throw new Error("id invaid");
      }
      const Venue = await venueRepository.findOne({where:{id:venue_id}})
      if (!Venue){
        res.status(404)
        throw new Error("Venue not found")
      }
      const photo_list = await venuePhotoRepository.find({where:{venue:Venue}})    
      res.status(200).json({photo_list})
    });
  export const VenueDeletePhoto = asyncHandler(
      async (req: UserRequest, res: Response) => {
        const venuePhoto_id: number = parseInt(req.params.id);
        if (req.user.role !== UserRole.ADMIN) {
          res.status(403);
          throw new Error("you have no rights");
        }
        if (!venuePhoto_id) {
          res.status(400);
          throw new Error("id invaid");
        }
        const Photo = await venuePhotoRepository.findOne({where:{id:venuePhoto_id}})
        if (!Photo){
          res.status(404)
          throw new Error("Photo not found")
        }
        deleteFileAWS(Photo.image_key)
        await venuePhotoRepository.remove(Photo)  
        
      res.status(200).json({"message":"photo delete succesfull"})
      });
    