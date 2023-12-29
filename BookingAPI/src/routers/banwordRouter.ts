import exress, { Router } from "express";
import { validateToken } from "../middlewares/validateToken";
import { FileGet } from "../controllers/fileController";
import { addBanWord, deleteBanWords, getBanWords } from "../controllers/banwordsController";



const router : Router = exress.Router();


router.get("/",validateToken,getBanWords)
router.put("/",validateToken,addBanWord)
router.delete("/",validateToken,deleteBanWords)


export {router}