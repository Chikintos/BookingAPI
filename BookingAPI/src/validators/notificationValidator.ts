import { number, object, string } from "yup";
import { UserRole } from "../entity/user";
import { notificationCode } from "../entity/notification";


export const messageFilter : object = {
    "all":null,
    "read":true,
    "unread":false
  }

export const notificationCreateSchema = object({
  message: string().min(5).required(),
  role: string().oneOf([UserRole.ADMIN]).required(),
  code: string().oneOf(Object.values(notificationCode)).required(),
  user_id: number().integer().min(0).required(),
});

export const getUserNotificationSchema = object({
  user_id: number().integer().required(),
  skip: number().integer().min(0).required(),
  filter: string().oneOf(Object.keys(messageFilter)).required(),
  order: string().oneOf(["ASC", "DESC"]).required(),
});
