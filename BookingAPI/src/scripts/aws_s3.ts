import S3 from "aws-sdk/clients/s3";
import fs  from "fs";
import * as fsprm from 'fs/promises';

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_ORIGIN;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;




const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
});


export async function uploadFile(file){
    const fileStream = fs.createReadStream(file.path)

    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: file.filename
    }
    const res =  s3.upload(uploadParams).promise()
    return res
}

export async function getFileAWS(filekey){
    const dowloadParams = {
        Key: filekey,
        Bucket: bucketName
    }
    try {
        await s3.headObject(dowloadParams).promise();
        return s3.getObject(dowloadParams).createReadStream()

      } catch (error) {
        return null
      }
}

exports.UploadFile = uploadFile,getFileAWS