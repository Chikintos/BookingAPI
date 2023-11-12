import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/user"
import { paymentCard } from "./entity/paymentCard";
import dotenv from "dotenv";
import { venue } from "./entity/venue";
import { photo_venue } from "./entity/photo_venue";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [User,paymentCard,venue,photo_venue],
    migrations: [],
    subscribers: [],
})
