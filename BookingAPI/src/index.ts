import { AppDataSource } from "./data-source"
import { User } from "./entity/user"
import  express  from "express"
import { router as userRouter } from "./routers/userRouter"
import bodyParser from "body-parser";
import errorHandler from "./middlewares/errorHandler";
import multer from "multer"
import swagerUI from "swagger-ui-express"
import * as yaml from "yaml"
import * as fs from "fs"

const app = express()
const port : number = +process.env.SERVER_PORT || 5000;
const host : string = process.env.DB_HOST || "localhost";
var upload = multer();



AppDataSource.initialize().then(async () => {
    console.log(`Connect to db ${process.env.DB_NAME}`)
}).catch(error => console.log(error))


app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(upload.array()); 
app.use(express.static('public'));

app.use("/api/user",userRouter)
const file  = fs.readFileSync('./src/swagger/openapi.yaml', 'utf8')
const swaggerDocument = yaml.parse(file)
console.log(swaggerDocument)
app.use("/api/docs",swagerUI.serve,swagerUI.setup(swaggerDocument))

app.use(errorHandler)


app.listen(port, () => {
  console.log(`[server]: Server is running at http://${host}:${port}`);
});