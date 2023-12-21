import { number, object, string } from "yup";
import { UserRole } from "../entity/user";





export const payCardAddSchema = object({
    // event_id: string().,
    place_number: number().min(0).required(),
    role: string().oneOf([UserRole.USER]).required(),
});