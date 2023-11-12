import { AppDataSource } from "./data-source"
import { User } from "./entity/user"
import  express  from "express"
import { router as userRouter } from "./routers/userRouter"
import { router as venueRouter } from "./routers/venueRouter"
import { router as fileRouter } from "./routers/fileRouter"

import upload from "./configs/multer_config"
import bodyParser from "body-parser";
import errorHandler from "./middlewares/errorHandler";
import swagerUI from "swagger-ui-express"
import * as yaml from "yaml"
import * as fs from "fs"

const app = express()
const port : number = +process.env.SERVER_PORT || 5000;
const host : string = process.env.DB_HOST || "localhost";


AppDataSource.initialize().then(async () => {
    console.log(`Connect to db ${process.env.DB_NAME}`)
}).catch(error => console.log(error))
const file  = fs.readFileSync('./src/swagger/openapi.yaml', 'utf8')
const swaggerDocument = yaml.parse(file)
console.log(swaggerDocument)



app.use(bodyParser.urlencoded()); 
app.use(bodyParser.json());
app.use(upload.single('image'))


app.use("/api/user",userRouter)
app.use("/api/venue",venueRouter)
app.use("/api/docs",swagerUI.serve,swagerUI.setup(swaggerDocument))
app.use("/image",fileRouter)
app.use(errorHandler)

app.listen(port, () => {
  console.log(`[server]: Server is running at http://${host}:${port}`);
});

