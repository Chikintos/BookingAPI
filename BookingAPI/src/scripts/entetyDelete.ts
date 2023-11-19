import { AppDataSource } from "../data-source";
import { photo_venue } from "../entity/photo_venue";
import { venue } from "../entity/venue";
import { deleteFileAWS } from "./aws_s3";

const venueRepository = AppDataSource.getRepository(venue)
const venuePhotoRepository = AppDataSource.getRepository(photo_venue)

export async function deleteVenueCascase (id : number) {
    const Venue = await venueRepository.findOne({where:{id},relations:{photos:true}})
    for (const photo of Venue.photos){
        const {description,image_key,id,venue} = photo
        await deleteFileAWS(image_key)
        await venuePhotoRepository.remove(photo)
        console.log(image_key,"droped")
    }
    venueRepository.remove(Venue)
}

export async function deleteEventCascase (id : number) {
    const Venue = await venueRepository.findOne({where:{id},relations:{photos:true}})
    for (const photo of Venue.photos){
        const {description,image_key,id,venue} = photo
        await deleteFileAWS(image_key)
        await venuePhotoRepository.remove(photo)
        console.log(image_key,"droped")
    }
    venueRepository.remove(Venue)
}



