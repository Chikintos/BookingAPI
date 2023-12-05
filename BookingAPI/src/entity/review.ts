import { Entity, BeforeRemove,PrimaryGeneratedColumn, Column,ManyToOne,JoinColumn, CreateDateColumn } from "typeorm"
import { Venue } from "./venue"
import { deleteFileAWS } from "../scripts/aws_s3"
import { integer } from "aws-sdk/clients/cloudfront"
import { Min,Max } from "class-validator"
import { User } from "./user"




@Entity({name:"review"})
export class Review {

    @PrimaryGeneratedColumn()
    id: number
    
    @Column({nullable:false})
    @Min(0)
    @Max(5)
    rate: integer

    @Column({nullable:true})
    comment: string

    @CreateDateColumn()
    createdDate: Date

    @ManyToOne(() => Venue,{nullable:false})
    venue: Venue

    @ManyToOne(() => User,{nullable:false})
    user: User
}
