import exress, { Router } from "express";
import { validateToken } from "../middlewares/validateToken";


const router : Router = exress.Router();


router.post("/",validateToken)







export {router}