import asyncHandler from "express-async-handler"
import jsonwebtoken from "jsonwebtoken"
import { Request, Response, NextFunction } from 'express';
import { UserRequest } from "./src/interfaces/UserRequest";


export const validateToken = (req: UserRequest, res: Response, next: NextFunction) => {
    let token 
    // @ts-ignore
    let authHeader :string = req.headers.Authorizatio || req.headers.authorization;

    if (!(authHeader && authHeader.startsWith("Bearer"))) {
        res.status(401)
        throw new Error("TOKEN NOT FOUND")
    }
    token = authHeader.split(" ")[1];
    jsonwebtoken.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
            res.status(401)
            throw new Error("USER unauth")
        }
        req.user=decoded.user;
        next()
    });
    if(!token){
        res.status(401)
        throw new Error("BAD TOKEN")
    }
}