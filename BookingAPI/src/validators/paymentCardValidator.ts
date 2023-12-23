import { number, object, string } from "yup";
import { UserRole } from "../entity/user";





export const payCardAddSchema = object({
    card_number: string().matches(/\b\d{16}$/).required(),
    date:string().matches(/\b\d{2}\/\d{2}$/).required(),
    owner_name: string().matches(/\b[A-Z]{1,20}\ [A-Z]{1,20}$/).required()
});

export const payCardDeleteSchema = object({
    card_id: number().integer().min(0).required(),

});