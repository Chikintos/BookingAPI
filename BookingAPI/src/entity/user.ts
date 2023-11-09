import { Entity, PrimaryGeneratedColumn, Column,OneToOne,JoinColumn,DeleteDateColumn } from "typeorm"
import { paymentCard } from "./paymentCard"

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
        length: 15,
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
    
    @DeleteDateColumn()
    deletedAt?: Date
}
