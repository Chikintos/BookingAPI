import exress, { Router } from "express";
import { validateToken } from "../middlewares/validateToken";
import { checkCallback, createOrder } from "../controllers/orderController";


const router : Router = exress.Router();

// create transaction

router.post("/",validateToken,createOrder)
router.all("/callback",checkCallback)







export {router}