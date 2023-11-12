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
import { uploadFile } from "../scripts/aws_s3";

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

    {
      //validators

      if (req.user.role !== UserRole.ADMIN) {
        res.status(403);
        throw new Error("you have no rights");
      }
      if (
        !(
          name &&
          address &&
          phone_number &&
          contact_name &&
          capacity &&
          description
        )
      ) {
        res.status(400);
        throw new Error("All parameters are required");
      }
      if (name.length > 40 || name.trim().length < 5) {
        res.status(400);
        throw new Error("name invalid");
      }
      if (address.trim().length < 5) {
        res.status(400);
        throw new Error("address invalid");
      }
      if (!phone_regex.test(phone_number)) {
        res.status(400);
        throw new Error("phone invalid");
      }
      if (contact_name.trim().length < 5) {
        res.status(400);
        throw new Error("contact name invalid");
      }
      const parse_capacity: number = parseInt(capacity);
      console.log(parse_capacity);
      if (!parse_capacity || parse_capacity >= 10000) {
        res.status(400);
        throw new Error("capacity invalid");
      }
    }
    const Venue = await venueRepository.create({
      name,
      address,
      phone_number,
      contact_name,
      capacity,
      description,
    });
    const existed_number = await venueRepository.find({
      where: { phone_number },
    });
    console.log(existed_number);
    if (existed_number[0]) {
      res.status(400);
      throw new Error("Venue with this phone number already exists");
    }
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

    // Validators
    if (
      !venue_id ||
      req.user.role !== UserRole.ADMIN ||
      name.length > 40 ||
      name.trim().length < 5 ||
      address.trim().length < 5 ||
      !phone_regex.test(phone_number) ||
      contact_name.trim().length < 5
    ) {
      res.status(400);
      throw new Error("Invalid input data");
    }

    const parse_capacity: number = parseInt(capacity);
    if (!parse_capacity || parse_capacity >= 10000 || parse_capacity <= 10) {
      res.status(400);
      throw new Error("Invalid capacity");
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
      const venue = await venueRepository.findOne({ where: { id: venue_id } });
      if (!venue) {
        res.status(404);
        throw new Error("venue not found");
      }
      await venueRepository.softRemove(venue);
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
      const Venue = await venueRepository.findOne({where:{id:venue_id}})
      if (!Venue){
        res.status(404)
        error.status = true
        error.text = "Venue not found"
      }
      if (error.status){
        fs.unlinkSync(photo.path)
        throw new Error(error.text)
      }
      const result = await uploadFile(photo)
      fs.unlinkSync(photo.path)
      
      const photo_venue = await venuePhotoRepository.create({
        description,
        image_key:result.Key,
        venue:Venue
      })
      const photo_result = await venuePhotoRepository.save(photo_venue)
      
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