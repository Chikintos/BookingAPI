import exress, { Router } from "express";
import { UserCreate, UserDelete, UserGet, UserLogin, UserRestore, UserUpdateInfo } from "../controllers/userController";
import { validateToken } from "../middlewares/validateToken";



const router : Router = exress.Router();


router.post("/login",UserLogin)
router.get("/:id",validateToken,UserGet)
router.post("/",UserCreate)
router.put("/:id",validateToken,UserUpdateInfo)
router.delete("/:id",validateToken,UserDelete)
router.get("/restore/:id",validateToken,UserRestore)







export {router}