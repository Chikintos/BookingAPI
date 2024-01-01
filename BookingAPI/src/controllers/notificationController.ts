import { UserRequest } from "../interfaces/UserRequest";
import { Response } from "express";
import asyncHandler from "express-async-handler";
import { AppDataSource } from "../data-source";
import { Notification } from "../entity/notification";
import {
  getUserNotificationSchema,
  messageFilter,
  notificationCreateSchema,
} from "../validators/notificationValidator";
import { User, UserRole } from "../entity/user";
import { emailSendMessage } from "../scripts/email-sender";

const notificationRepository = AppDataSource.getRepository(Notification);
const userRepository = AppDataSource.getRepository(User);

export const createNotification = asyncHandler(
  async (req: UserRequest, res: Response) => {
    try {
      const { message, user_id, code } = req.body;
      try {
        await notificationCreateSchema.validate({
          message,
          role: req.user.role,
          code,
          user_id,
        });
      } catch (err) {
        res.status(400);
        throw new Error(err.message);
      }
      const user: User = await userRepository.findOneBy({ id: user_id });
      const admin: User = await userRepository.findOneBy({
        id: req.user.id,
      });
      if (!user || !admin) {
        res.status(404);
        throw new Error("user or admin not found");
      }
      let notification: Notification = await notificationRepository.create({
        code,
        message,
        admin,
        user,
      });
      notification = await notificationRepository.save(notification);
      // send email
      const link = `${process.env.URL}/api/notification/${notification.id}`
      const send_email = await emailSendMessage(
        {
          Email: "triathlet.52@gmail.com",
          Name: "sendersss",
        },
        {
          Email: user.email,
          Name: user.firstName,
        },
        {
          message_type: "notification",
          data: { code: notification.code, text: notification.message,link},
        }
      );
      res.json(notification.id);
    } catch (err) {
      if (res.statusCode === 200) {
        res.status(500);
      }
      throw new Error(err.message);
    }
  }
);

export const getNotification = asyncHandler(
  async (req: UserRequest, res: Response) => {
    try {
      const notification_id: number = parseInt(req.params.id);
      if (!notification_id) {
        res.status(400);
        throw new Error("Invalid Id");
      }
      const notification: Notification = await notificationRepository.findOne({
        where: { id: notification_id },
        relations: { user: true, admin: true },
        select: {
          user: {
            id: true,
            email: true,
            role: true,
          },
          admin: {
            firstName: true,
            email: true,
          },
          id: true,
          message: true,
          code: true,
        },
      });
      if (!notification) {
        res.status(404);
        throw new Error("notification not found");
      }
      if (notification.user.id == req.user.id) {
        notification.view = true;
        await notificationRepository.save(notification);
      } else if (req.user.role !== UserRole.ADMIN) {
        throw new Error("only recipient and admin cat see a message");
      }
      res.json(notification);
    } catch (err) {
      if (res.statusCode === 200) {
        res.status(500);
      }
      throw new Error(err.message);
    }
  }
);

export const getUserNotification = asyncHandler(
  async (req: UserRequest, res: Response) => {
    try {
      const { skip, filter, order } = req.body;
      const user_id: number = parseInt(req.params.id);

      try {
        await getUserNotificationSchema.validate({
          user_id,
          skip,
          filter,
          order,
        });
      } catch (err) {
        res.status(400);
        throw new Error(err.message);
      }

      const user: User = await userRepository.findOneBy({ id: user_id });
      if (user.id != req.user.id && req.user.role !== UserRole.ADMIN) {
        res.status(403);
        throw new Error("only recipient and admin cat see a message");
      }
      const notification: [Notification[], number] =
        await notificationRepository.findAndCount({
          where: { user, view: messageFilter[filter] },
          select: {
            id: true,
            message: true,
            code: true,
            createdDate: true,
            view: true,
          },
          order: { createdDate: order },
          skip,
          take: 10,
        });

      res.json(notification);
    } catch (err) {
      if (res.statusCode === 200) {
        res.status(500);
      }
      throw new Error(err.message);
    }
  }
);

export const getNotificationNumberByUser = asyncHandler(
  async (req: UserRequest, res: Response) => {
    try {
      const user_id: number = parseInt(req.params.id);

      const user: User = await userRepository.findOneBy({ id: user_id });
      if (user.id != req.user.id) {
        res.status(403);
        throw new Error("only recipient can see a message number");
      }
      const notification_number: number = await notificationRepository.count({
        where: { user, view: false },
      });

      res.json(notification_number);
    } catch (err) {
      if (res.statusCode === 200) {
        res.status(500);
      }
      throw new Error(err.message);
    }
  }
);
