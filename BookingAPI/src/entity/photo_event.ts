import { Entity, BeforeRemove,PrimaryGeneratedColumn, Column,ManyToOne,JoinColumn } from "typeorm"
import { Event } from "./event"




@Entity({name:"photo_event"})
export class photo_event {

    @PrimaryGeneratedColumn()
    id: number

    @Column({length:40})
    description: string

    @Column({
        unique:false
    })
    image_key: string


    @ManyToOne(() => Event, (Event) => Event.photos,{ onDelete: "CASCADE" })
    event: Event

}
