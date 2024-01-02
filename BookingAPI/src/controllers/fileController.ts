

import { UserRequest } from "../interfaces/UserRequest";
import  { Response } from "express";
import asyncHandler from "express-async-handler";
import { getFileAWS } from "../scripts/aws_s3";

// Route handler for retrieving a file from AWS S3
export const FileGet = asyncHandler(async (req: UserRequest, res: Response) => {
    
    // Extract the object key from the request parameters
    const key = req.params.key
   
    // Get a readable stream for the file from AWS S3
    const readStream = (await getFileAWS(key))
  
    // Check if the read stream is available
    if (!readStream){
        res.status(403)
        throw new Error("not permission")
    }
 
    // Send the file content as the response
    res.send(readStream)

    })


