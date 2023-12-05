import exress, { Router } from "express";
import { validateToken } from "../middlewares/validateToken";
import { ReviewCreate, ReviewDelete, ReviewGet, ReviewGetUser, ReviewGetVenue } from "../controllers/reviewController";

// GET by ID\user\venue,CREATE,Delete

const router : Router = exress.Router();


router.post("/",validateToken,ReviewCreate)

router.get("/user/:id",validateToken,ReviewGetUser)
router.get("/:id",validateToken,ReviewGet)
router.get("/venue/:id",ReviewGetVenue)
router.post("/:id",validateToken,ReviewCreate)
router.delete("/:id",validateToken,ReviewDelete)







export {router}