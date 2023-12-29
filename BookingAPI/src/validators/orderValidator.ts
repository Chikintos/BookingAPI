import { number, object, string } from "yup";
import { orderStatus } from "../entity/order";
import { UserRole } from "../entity/user";





export const orderCreateSchema = object({
    event_id: number().integer().min(0).required(),
    place_number: number().min(0).required(),
    role: string().oneOf([UserRole.USER]).required(),
});

export const orderByUserSchema = object({
    user_id: number().integer().required(),
    status: string().oneOf(["all",...Object.values(orderStatus)]).required(),
    skip:number().integer().min(0).required(),
});
