import fs  from "fs";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
const { Upload } = require("@aws-sdk/lib-storage");

// Retrieve AWS S3 configuration from environment variables
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_ORIGIN;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;



// Create an S3 client instance
const client : S3Client = new S3Client({
    region,
    credentials:{
        accessKeyId,
        secretAccessKey
    }
});

// Function to upload a file to AWS S3
export async function uploadFile(file){
    const fileStream = fs.createReadStream(file.path)
    const upload = new Upload({
        client,
        params: {
            Bucket: bucketName,
            Body: fileStream,
            Key: file.filename,
        }
    })
    // Log progress during the upload
    upload.on("httpUploadProgress", (progress) => {
        console.log(progress);
      });
      
      // Wait for the upload to complete
      await upload.done();
}


// Function to get a file from AWS S3
export async function getFileAWS(filekey : string){
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

// Function to delete a file from AWS S3
export async function deleteFileAWS(filekey : string)  {
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