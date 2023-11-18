import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn
} from "typeorm";
import { photo_venue } from "./photo_venue";

@Entity({ name: "venue" })
export class venue {
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

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => photo_venue, (photoVenue) => photoVenue.venue)
  photos: photo_venue[];
}
