import { UserRequest } from "../interfaces/UserRequest";
import { Response } from "express";
import asyncHandler from "express-async-handler";
import { AppDataSource } from "../data-source";
import { Notification } from "../entity/notification";

const notificationRepository = AppDataSource.getRepository(Notification);

export const createNotification = asyncHandler(
  async (req: UserRequest, res: Response) => {}
);

export const deleteNotification = asyncHandler(
  async (req: UserRequest, res: Response) => {}
);

export const setReadNotification = asyncHandler(
  async (req: UserRequest, res: Response) => {}
);

export const getNotification = asyncHandler(
  async (req: UserRequest, res: Response) => {}
);
