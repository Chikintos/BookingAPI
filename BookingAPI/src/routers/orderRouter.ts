import exress, { Router } from "express";
import { validateToken } from "../middlewares/validateToken";
import { cancelOrder, checkCallback, createOrder, getOrder, getOrderByUser } from "../controllers/orderController";
import { generateQR } from "../scripts/scripts";


const router : Router = exress.Router();

router.post("/",validateToken,createOrder)
router.post("/cancel/:id",validateToken,cancelOrder)
router.get("/:id",validateToken,getOrder)
router.get("/user/:id",validateToken,getOrderByUser)



router.post("/callback",checkCallback)







export {router}