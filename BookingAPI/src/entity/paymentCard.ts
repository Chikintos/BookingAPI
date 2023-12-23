import { Entity, PrimaryGeneratedColumn, Column,OneToOne,JoinColumn, Unique } from "typeorm"
import { User } from "./user"



@Unique(["card_number", "date"])
@Entity({name:"payment_card"})
export class paymentCard {
    @PrimaryGeneratedColumn()
    id: number

    @Column({length:40})
    owner_name: string

    @Column({
        length:16,
        unique:false
    })
    card_number: string

    @Column({
        length: 5,
    })
    date: string


    @OneToOne(() => User, (user) => user.pay_card,{nullable: true})
    @JoinColumn({name:"user_id"})
    user: User
}
