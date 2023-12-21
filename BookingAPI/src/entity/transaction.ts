import { Entity, PrimaryGeneratedColumn, Column,OneToOne,JoinColumn, CreateDateColumn, ManyToOne } from "typeorm"
import { paymentCard } from "./paymentCard"

export enum transactionStatus {
    SUCCESSFUL = "successful",
    PROCESS = "process",
    CANCELED = "canceled",
    REFUND = "refund",

}


@Entity({name:"transaction"})
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "enum",
        enum: transactionStatus,
        default: transactionStatus.PROCESS,
    })
    status: transactionStatus

    @CreateDateColumn()
    createdDate: Date

    @ManyToOne(() => paymentCard,{ onDelete: "CASCADE" })
    payment_card: paymentCard


}
