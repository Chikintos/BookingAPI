import { object, string, number, date } from "yup";
import {  UserRole } from "../entity/user";


export const eventCreateSchema = object({
    role: string().oneOf([UserRole.ADMIN,UserRole.ORGANIZER]).required(),
    venue_id: number().integer().min(0).required(),
    name: string().min(3).max(50).required(),
    price:number().min(0).integer().required(),
    date_start: date().required(),
    date_end: date().required(),
    description: string().min(50).required(),
    event_type: string().min(3).max(50).required(),
});


export const eventUpdateSchema = object({
    role: string().oneOf([UserRole.ADMIN,UserRole.ORGANIZER]).required(),
    event_id: number().integer().min(0),
    venue_id: number().integer().min(0),
    name: string().min(3).max(50),
    price:number().min(0).integer(),
    date_start: date(),
    date_end: date(),
    description: string().min(50),
    event_type: string().min(3).max(50),
});
