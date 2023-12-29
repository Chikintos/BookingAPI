import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
} from "typeorm";
import { Venue } from "./venue";
import { User } from "./user";

export enum notificationCode {
  INFO = 10,
  SUCCESS = 20,
  ERROR = 30,
  ALERT = 31,
}

@Entity({ name: "notification" })
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: notificationCode,
  })
  code: notificationCode;

  @CreateDateColumn()
  createdDate: Date;

  @Column({
    default: false,
  })
  view: boolean;

  @Column({
    nullable: false,
  })
  message: string;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @ManyToOne(() => User, { nullable: false })
  admin: User;
}
