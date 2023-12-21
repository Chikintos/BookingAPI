

import { UserRequest } from "../interfaces/UserRequest";
import  { Response } from "express";
import asyncHandler from "express-async-handler";
import { AppDataSource } from "../data-source";
import { User } from "../entity/user";

const userRepository = AppDataSource.getRepository(User);


export const addCard = asyncHandler(async (req: UserRequest, res: Response) => {
        const user_id: number = parseInt(req.params.id);
        try{
            
            const user: User = await userRepository.findOneBy({id:user_id})
            
        }catch(err){
            if (res.statusCode === 200){
                res.status(500)
            }
            throw new Error(err.message)
        }

    })


