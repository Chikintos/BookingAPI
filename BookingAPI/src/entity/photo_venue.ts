import { Entity, BeforeRemove,PrimaryGeneratedColumn, Column,ManyToOne,JoinColumn } from "typeorm"
import { venue } from "./venue"
import { deleteFileAWS } from "../scripts/aws_s3"




@Entity({name:"photo_venue"})
export class photo_venue {

    @PrimaryGeneratedColumn()
    id: number

    @Column({length:40})
    description: string

    @Column({
        unique:false
    })
    image_key: string


    @ManyToOne(() => venue, (venue) => venue.photos,{ onDelete: "CASCADE" })
    venue: venue




}
