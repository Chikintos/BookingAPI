import { object, string, number, array, mixed } from "yup";
import { UserRole } from "../entity/user";
import { phone_regex } from "./userValidator";


export const venueCreateSchema = object({
    role: string().oneOf([UserRole.ADMIN]).required(),
    name: string().min(5).max(40).required(),
    address: string().min(5).required(),
    phone_number: string().matches(phone_regex, { excludeEmptyString: true }).required(),
    contact_name: string().min(5).required(),
    capacity: number().min(50).max(10000).integer().required(),
    description: string().min(100).max(5000).required(),
  });


export const venueUpdateSchema = object({
    venue_id: number().min(1).integer().required(),
    role: string().oneOf([UserRole.ADMIN]).required(),
    name: string().min(5).max(40),
    phone_number: string().matches(phone_regex, { excludeEmptyString: true }),
    address: string().min(5),
    contact_name: string().min(5),
    capacity: number().min(50).max(10000).integer(),
    description: string().min(100).max(5000),
  });

export const AddPhotoSchema = object({
  photo: mixed().required().defined(),
  role: string().oneOf([UserRole.ADMIN]),
  id: number().min(1).integer().required(),
  description: string().max(40),
})
