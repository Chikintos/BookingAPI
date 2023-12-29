import { number, object, string } from "yup";
import { orderStatus } from "../entity/order";
import { UserRole } from "../entity/user";





export const BanWordSchema = object({
    word: string().required(),
    role: string().oneOf([UserRole.ADMIN]).required(),
});

export const orderByUserSchema = object({
    user_id: number().integer().required(),
    status: string().oneOf(["all",...Object.values(orderStatus)]).required(),
    skip:number().integer().min(0).required(),
});
