import { Entity, PrimaryGeneratedColumn, Column,OneToOne,JoinColumn } from "typeorm"
import { User } from "./user"




@Entity({name:"payment_card"})
export class paymentCard {
    @PrimaryGeneratedColumn()
    id: number

    @Column({length:40})
    owner_name: string

    @Column({
        length:16,
        unique:true
    })
    number: string

    @Column({
        length: 5,
    })
    date: string

    @Column({
        length: 3,
    })
    cvv: string

    @OneToOne(() => User, (user) => user.pay_card,{nullable: true})
    @JoinColumn({name:"user_id",})
    user: User
}
