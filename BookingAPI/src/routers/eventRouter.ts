import exress, { Router } from "express";
import { validateToken } from "../middlewares/validateToken";
import {  eventAddPhoto, eventCreate, eventDelete, eventDeletePhoto, eventGet, eventGetByUser, eventGetPhoto, eventUpdate } from "../controllers/eventController";



const router : Router = exress.Router();


// POST/GET/PUT/DELETE if user admin GET + orginizator info event, +
// GET events by user +
// ADD/DELETE PHOTO

router.post("/",validateToken,eventCreate)
router.get("/:id",eventGet)
router.put("/:id",validateToken,eventUpdate)
router.delete("/:id",validateToken,eventDelete)

router.get("/user/:id",validateToken,eventGetByUser)

router.post("/:id/photo",validateToken,eventAddPhoto)
router.get("/:id/photo",validateToken,eventGetPhoto)
router.delete("/photo/:id",validateToken,eventDeletePhoto)


export {router}