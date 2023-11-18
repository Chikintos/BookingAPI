import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entity/user";
import asyncHandler from "express-async-handler";
import * as EmailValidator from "email-validator";
import { Request, Response } from "express";
import { UserRequest } from "../interfaces/UserRequest";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import { IsNull, Not } from "typeorm";
import { Console } from "console";
import {
  userCreateSchema,
  userLoginSchema,
  userPutSchema,
} from "../validators/userValidator";

const usersRepository = AppDataSource.getRepository(User);

export const UserGet = asyncHandler(async (req: UserRequest, res: Response) => {
  const user_id: number = parseInt(req.params.id);

  if (isNaN(user_id)) {
    res.status(400);
    throw new Error("id invaid");
  }
  if (req.user.id !== user_id && req.user.role !== UserRole.ADMIN) {
    res.status(403);
    throw new Error("you have no rights");
  }

  const user = await usersRepository.find({
    where: {
      id: user_id,
    },
    select: ["firstName", "lastName", "email", "phone_number", "role"],
  });
  if (!user.length) {
    res.status(404).json({ error: "user not found" });
  }

  res.json(user);
});

export const UserCreate = asyncHandler(async (req: Request, res: Response) => {
  let { email, role, password } = req.body;
  try {
    await userCreateSchema.validate({
      email,
      role,
      password,
    });
  } catch (err) {
    res.status(400);
    throw new Error(err.errors.toString());
  }

  const oldUser = await usersRepository.findOne({
    where: {
      email: email,
    },
  });
  if (oldUser) {
    res.status(400);
    throw new Error("email already used");
  }
  password = await bcrypt.hash(password, 10);
  const user = await usersRepository.create({
    email,
    role,
    password,
  });
  try {
    const results = await usersRepository.save(user);
    res.status(200).json({ message: "user create succesfull" });
  } catch (error) {
    res.status(500);
    throw new Error("server error");
  }
});

export const UserLogin = asyncHandler(async (req: Request, res: Response) => {
  let { email, password } = req.body;
  const token = process.env.ACCESS_TOKEN_SECRET;
  try {
    await userLoginSchema.validate({
      email,
      password,
    });
  } catch (err) {
    res.status(400);
    throw new Error(err.errors.toString());
  }

  const user = await usersRepository.findOne({ where: { email } });
  if (!user) {
    res.status(404);
    throw new Error("password or email invalid");
  }

  const password_valid = await bcrypt.compare(password, user.password);
  if (!password_valid) {
    res.status(400);
    throw new Error("password or email invalid");
  }
  const user_sign = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email,
    role: user.role,
  };
  const user_token = jsonwebtoken.sign(
    {
      user: user_sign,
    },
    token,
    { expiresIn: "5h" }
  );

  res.json({ user_token, user_sign });
});

export const UserUpdateInfo = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { firstName, lastName, phone_number, email } = req.body;
    const user_id: number = parseInt(req.params.id);

    if (req.user.id !== user_id) {
      res.status(403);
      throw new Error("you can`t change anthore user`s info");
    }
    try {
      await userPutSchema.validate({
        user_id,
        firstName,
        lastName,
        phone_number,
        email,
      });
    } catch (err) {
      res.status(400);
      throw new Error(err.errors.toString());
    }
    const user = await usersRepository.findOne({ where: { id: user_id } });
    if (!user) {
      res.status(404);
      throw new Error("user not found");
    }
    if (firstName) {
      user.firstName = firstName;
    }
    if (lastName) {
      user.lastName = lastName;
    }
    if (phone_number) {
      user.phone_number = phone_number;
    }
    if (email) {
      user.email = email;
    }
    await usersRepository.save(user);

    const fieldsToDelete = ["password", "isActive", "role","deletedAt"];
    fieldsToDelete.forEach((field) => delete user[field]);

    res.status(200).json({ user });
  }
);

export const UserDelete = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const user_id: number = parseInt(req.params.id);
    if (!user_id) {
      res.status(400);
      throw new Error("id invaid");
    }
    if (req.user.id !== user_id && req.user.role !== UserRole.ADMIN) {
      res.status(403);
      throw new Error("you have no rights");
    }
    const user = await usersRepository.findOne({ where: { id: user_id } });
    if (!user) {
      res.status(404);
      throw new Error("user not found");
    }
    await usersRepository.softRemove(user);
    const fieldsToDelete = ["password", "isActive", "role","deletedAt"];
    fieldsToDelete.forEach((field) => delete user[field]);
    res.status(200).json({ message: "delete succesfull" });
  }
);

export const UserRestore = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const user_id: number = parseInt(req.params.id);

    if (req.user.role !== UserRole.ADMIN) {
      res.status(403);
      throw new Error("you have no rights");
    }
    const user = await usersRepository.findOne({
      where: { id: user_id },
      withDeleted: true,
    });
    if (!user) {
      res.status(404);
      throw new Error("user not found");
    }

    await usersRepository.restore(user.id);

    const fieldsToDelete = ["password", "isActive", "role","deletedAt"];
    fieldsToDelete.forEach((field) => delete user[field]);
    res.status(200).json(user);
  }
);
