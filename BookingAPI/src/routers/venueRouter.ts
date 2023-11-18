import exress, { Router } from "express";
import { UserCreate, UserDelete, UserGet, UserLogin, UserRestore, UserUpdateInfo } from "../controllers/userController";
import { validateToken } from "../middlewares/validateToken";
import { VenueAddPhoto, VenueCreate, VenueDelete, VenueDeletePhoto, VenueGet, VenueGetPhoto, VenueUpdate } from "../controllers/venueController";
import upload from "../configs/multer_config"

const router : Router = exress.Router();


router.post("/",validateToken,VenueCreate)
router.get("/:id",validateToken,VenueGet)

router.put("/:id",validateToken,VenueUpdate)
router.delete("/:id",validateToken,VenueDelete)
router.post("/:id/photo",validateToken,VenueAddPhoto)
router.get("/:id/photo",validateToken,VenueGetPhoto)
router.delete("/photo/:id",validateToken,VenueDeletePhoto)






export {router}