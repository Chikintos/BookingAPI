import exress, { Router } from "express";
import { validateToken } from "../middlewares/validateToken";
import { cancelOrder, checkCallback, createOrder, getOrder, getOrderByUser, sendemail } from "../controllers/orderController";


const router : Router = exress.Router();


router.post("/",validateToken,createOrder)
router.post("/cancel/:id",validateToken,cancelOrder)
router.get("/:id",validateToken,getOrder)
router.get("/user/:id",validateToken,getOrderByUser)
router.get("/email",sendemail)

router.post("/callback",checkCallback)







export {router}