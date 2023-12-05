import { object, string, number, date } from "yup";
import {  UserRole } from "../entity/user";
import { Check_Profanity } from "../scripts/scripts";





export const reviewCreateSchema = object({
    role: string().oneOf([UserRole.USER,UserRole.ADMIN]).required(),
    venue_id: number().integer().min(0).required(),
    user_id: number().integer().min(0).required(),
    rate: number().min(0).max(5).required(),
    comment: string().min(10).max(1000).test('comment-check', 'Comment validation failure', 
        async function(value) {
            if (!value){
                return true
            }
            const result = await Check_Profanity(value)
            console.log(result)
            return result ? this.createError({message:"text include profanity"}) : true
        }).nullable()
    
});

export const reviewGetByUserSchema = object({
    venue_id: number().integer().min(0).required(),
    
});
