import exress, { Router } from "express";
import { validateToken } from "../middlewares/validateToken";
import {
  createNotification,
  getNotification,
  getNotificationNumberByUser,
  getUserNotification,
} from "../controllers/notificationController";


const router: Router = exress.Router();

router.post("/", validateToken, createNotification);
router.get("/:id", validateToken, getNotification);
router.get("/user/:id", validateToken, getUserNotification);
router.get("/user/count/:id", validateToken, getNotificationNumberByUser);

export { router };
