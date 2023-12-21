import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn
} from "typeorm";
import { photo_venue } from "./photo_venue";
import { Event } from "./event";
import { Max, Min } from "class-validator";

@Entity({ name: "venue" })
export class Venue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 40,
    nullable: false,
  })
  name: string;

  @Column({ nullable: false })
  address: string;

  @Column({
    length: 19,
    unique: true,
    nullable: true,
  })
  phone_number: string;

  @Column({
    type: "integer",
    nullable: false,
  })
  capacity: number;

  @Column({
    nullable: false,
  })
  contact_name: string;

  @Column({
    nullable: false,
  })
  description: string;

  @Column({nullable:false,default:0,type:"decimal"})
  @Min(0)
  @Max(5)
  rate: number

  
  @OneToMany(() => photo_venue, (photoVenue) => photoVenue.venue)
  photos: photo_venue[];

  @OneToMany(() => Event, (event) => event.venue,)
  events: Event[];
}
