import exress, { Router } from "express";
import { validateToken } from "../middlewares/validateToken";
import { FileGet } from "../controllers/fileController";



const router : Router = exress.Router();


router.get("/:key",FileGet)







export {router}