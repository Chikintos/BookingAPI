import { Entity, PrimaryGeneratedColumn, Column,OneToOne,JoinColumn, CreateDateColumn, OneToMany, ManyToOne } from "typeorm"
import { User } from "./user"
import { Transaction } from "./transaction"
import { Event } from "./event"

export enum orderStatus {
    SUCCESSFUL = "successful",
    WAITING = "waiting",
    CLOSED = "closed",
    CANCELED = "canceled"
}


@Entity({name:"order"})
export class Order {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "enum",
        enum: orderStatus,
        default: orderStatus.WAITING,
    })
    status: orderStatus

    @CreateDateColumn()
    createdDate: Date

    @Column({
        nullable:false
    })
    amount: number

    @Column({
        nullable:false
    })
    place_number: number

    @OneToOne(() => Transaction,{ onDelete: "CASCADE" })
    @JoinColumn()
    transaction: Transaction

    @ManyToOne(() => User,{ onDelete: "CASCADE" })
    @JoinColumn()
    user: User

    @ManyToOne(() => Event,{ onDelete: "CASCADE" })
    @JoinColumn()
    event: Event

}
