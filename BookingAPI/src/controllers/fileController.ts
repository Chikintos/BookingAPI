

import { UserRequest } from "../interfaces/UserRequest";
import  { Response } from "express";
import asyncHandler from "express-async-handler";
import { getFileAWS } from "../scripts/aws_s3";


export const FileGet = asyncHandler(async (req: UserRequest, res: Response) => {
    const key = req.params.key
    const readStream = await getFileAWS(key)
    if (!readStream){
        res.status(403)
        throw new Error("not permission")
    }
    readStream.pipe(res)

    })


