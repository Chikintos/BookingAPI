import { Entity, BeforeRemove,PrimaryGeneratedColumn, Column,ManyToOne,JoinColumn } from "typeorm"
import { event } from "./event"




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


    @ManyToOne(() => event, (Event) => Event.photos,{ onDelete: "CASCADE" })
    event: event




}
