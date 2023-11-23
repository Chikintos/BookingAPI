import { Entity, PrimaryGeneratedColumn, Column,OneToOne,JoinColumn,DeleteDateColumn, OneToMany } from "typeorm"
import { paymentCard } from "./paymentCard"
import { event } from "./event"

export enum UserRole {
    ADMIN = "admin",
    ORGANIZER = "organizer",
    USER = "user",
}
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({length:40,nullable:true})
    firstName: string

    @Column({length:40,nullable:true})
    lastName: string

    @Column({
        length: 50,
        unique: true
    })
    email: string

    @Column({
        length: 20,
        unique:true,
        nullable:true
    })
    phone_number: string

    @Column()
    password: string

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole

    @Column({default:false})
    isActive: boolean

    @OneToOne(() => paymentCard, (pay_card) => pay_card.user) 
    pay_card: paymentCard
    
    @OneToMany(() => event, (event) => event.created_by)
    events: event[]


    @DeleteDateColumn()
    deletedAt?: Date
}
