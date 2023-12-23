import exress, { Router } from "express";
import { validateToken } from "../middlewares/validateToken";
import { addCard, deleteCard } from "../controllers/paymentCardController";


const router : Router = exress.Router();


router.post("/",validateToken,addCard)
router.delete("/",validateToken,deleteCard)






export {router}