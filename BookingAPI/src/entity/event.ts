import { Entity, PrimaryGeneratedColumn, Column,OneToOne,JoinColumn, ManyToOne, OneToMany } from "typeorm"
import { User } from "./user"
import { integer } from "aws-sdk/clients/cloudfront"
import { Venue } from "./venue"
import { photo_event } from "./photo_event"

export enum eventStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    REJECTED = "rejected",

}


@Entity({name:"event"})
export class event {
    @PrimaryGeneratedColumn()
    id: number

    @Column({length:50, nullable:false})
    name: string

    @Column({nullable:false})
    price: integer

    @Column({type: "timestamp",nullable:false})
    date_start

    @Column({type: "timestamp",nullable:false})
    date_end

    @Column({
        type: "enum",
        enum: eventStatus,
        default: eventStatus.PENDING,
        nullable:false
    })
    status: eventStatus

    @Column({nullable:false})
    description: string

    @Column({length:50,nullable:false})
    event_type: string

    @ManyToOne(() => User, (user) => user.events,{ onDelete: "CASCADE",nullable:false })
    created_by: User

    @ManyToOne(() => Venue, (venue) => venue.events,{ onDelete: "CASCADE",nullable:false })
    venue: Venue

    @OneToMany(() => photo_event, (photo_event) => photo_event.event)
    photos: photo_event[];
  
}
