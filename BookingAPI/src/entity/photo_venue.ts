import { Entity, PrimaryGeneratedColumn, Column,ManyToOne,JoinColumn } from "typeorm"
import { venue } from "./venue"




@Entity({name:"photo_venue"})
export class photo_venue {
    @PrimaryGeneratedColumn()
    id: number

    @Column({length:40})
    description: string

    @Column({
        unique:true
    })
    image_key: string


    @ManyToOne(() => venue, (venue) => venue.photos)
    venue: venue
}
