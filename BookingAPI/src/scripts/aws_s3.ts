import fs  from "fs";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_ORIGIN;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;




const client = new S3Client({
    region,
    credentials:{
        accessKeyId,
        secretAccessKey
    }
});


export async function uploadFile(file){
    const fileStream = fs.createReadStream(file.path)
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Body: fileStream,
        Key: file.filename,
        ContentType:file.mimetype
    })
    
    try {
        const response = await client.send(command);
        console.log(response)
        return response
      } catch (err) {
        throw new Error(err)

    }
}



export async function getFileAWS(filekey){
    const command = new GetObjectCommand({
        Key: filekey,
        Bucket: bucketName
    })
    try {
        const response = await client.send(command);
        const chunks = [];
        for await (const chunk of response.Body) {
            chunks.push(chunk);
        }
        const data = await response.Body;
        return Buffer.concat(await chunks)
      } catch (error) {
        throw new Error(error)
      }
}

export async function deleteFileAWS(filekey:string)  {
    const command = new DeleteObjectCommand({
        Key: filekey,
        Bucket: bucketName
    })
    try{
        const response = client.send(command)
        return response
    
    }catch(error){
        throw new Error(error)
    }
}
exports.UploadFile = uploadFile,getFileAWS