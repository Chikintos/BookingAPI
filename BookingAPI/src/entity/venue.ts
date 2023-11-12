import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
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
    nullable: false,
  })
  phone_number: string;

  @Column({
    nullable: false,
  })
  contact_name: string;

  @Column({
    type: "integer",
    nullable: false,
  })
  capacity;

  @Column({
    nullable: false,
  })
  description: string;

  @DeleteDateColumn()
  deletedAt?: Date

  @OneToMany(() => photo_venue, (photo) => photo.venue)
  photos: photo_venue[]
}
