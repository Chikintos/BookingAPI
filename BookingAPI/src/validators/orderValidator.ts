import { number, object, string } from "yup";
import { UserRole } from "../entity/user";





export const orderCreateSchema = object({
    event_id: number().integer().min(0).required(),
    place_number: number().min(0).required(),
    role: string().oneOf([UserRole.USER]).required(),
});