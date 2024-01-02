import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entity/user";
import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { UserRequest } from "../interfaces/UserRequest";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import {
  userCreateSchema,
  userLoginEmailSchema,
  userLoginPhoneSchema,
  userPutSchema,
} from "../validators/userValidator";

//Access repositories from the data source
const usersRepository = AppDataSource.getRepository(User);

//handler to get user information
export const UserGet = asyncHandler(async (req: UserRequest, res: Response) => {
  const user_id: number = parseInt(req.params.id);

  if (isNaN(user_id)) {
    res.status(400);
    throw new Error("id invaid");
  }
  
  // Check user permissions
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
    res.status(404)
    throw new Error("user not found");

  }

  res.json({user});
});

//handler to create a new user
export const UserCreate = asyncHandler(async (req: Request, res: Response) => {
  let { email, role, password } = req.body;
  try {
    // Validate request parameters
    await userCreateSchema.validate({
      email,
      role,
      password,
    });
  } catch (err) {
    res.status(400);
    throw new Error(err.errors.toString());
  }

  // Check if email is already used
  const oldUser = await usersRepository.findOne({
    where: {
      email: email,
    },
  });
  if (oldUser) {
    res.status(400);
    throw new Error("email already used");
  }

  // Hash the password and create the user
  password = await bcrypt.hash(password, 10);
  const user = await usersRepository.create({
    email,
    role,
    password,
  });

  // Save the user to the database
  try {
    await usersRepository.save(user);
    res.status(200).json({ message: "user create succesfull",user_id:user.id });
  } catch (error) {
    res.status(500);
    throw new Error("server error");
  }
});

//handler to login a user
export const UserLogin = asyncHandler(async (req: Request, res: Response) => {
  let { email, password,phone_number } = req.body;
  console.log(req.body)
  const token = process.env.ACCESS_TOKEN_SECRET;
  let user : User

  // Validate and find user based on email or phone_number
  if (email){
    // Validate email login
    try {
      await userLoginEmailSchema.validate({
        email,
        password,
      });
    } catch (err) {
      res.status(400);
      throw new Error(err.errors.toString());
    }
    user = await usersRepository.findOne({ where: { email } });
    if (!user) {
      res.status(404);
      throw new Error("password or email invalid");
    }
  
  }
  else if (phone_number){
  // Validate phone_number login
    try {
      await userLoginPhoneSchema.validate({
        phone:phone_number,
        password,
      });
    } catch (err) {
      res.status(400);
      throw new Error(err.errors.toString());
    }
    user = await usersRepository.findOne({ where: { phone_number } });
    if (!user) {
      res.status(404);
      throw new Error("password or phone number invalid");
    }
  }
  else{
    res.status(400);
    throw new Error("Put email or phone number");
  }


  // Validate the password
  const password_valid : boolean = await bcrypt.compare(password, user.password);
  if (!password_valid) {
    res.status(400);
    throw new Error( email ? "password or email invalid" : "password or phone number invalid");
  }

  const user_sign = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email,
    role: user.role,
  };
  // Create a JWT token for the user
  const user_token = jsonwebtoken.sign(
    {
      user: user_sign,
    },
    token,
    { expiresIn: "5h" }
  );

  res.json({ user_token, user_sign });
});

//handler to update user information
export const UserUpdateInfo = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { firstName, lastName, phone_number, email } = req.body;
    const user_id: number = parseInt(req.params.id);

    // Check user permissions
    if (req.user.id !== user_id) {
      res.status(403);
      throw new Error("you can`t change anthore user`s info");
    }

    // Validate request parameters
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
    
    // Update user information
    if (!user) {
      res.status(404);
      throw new Error("user not found");
    }
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.phone_number = phone_number || user.phone_number;
      user.email = email || user.email;

    // Save the updated user
    await usersRepository.save(user);

    // Remove sensitive information from the response
    const fieldsToDelete = ["password", "isActive", "role","deletedAt"];
    fieldsToDelete.forEach((field) => delete user[field]);

    res.status(200).json({ user });
  }
);

//handler to delete a user
export const UserDelete = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const user_id: number = parseInt(req.params.id);
    if (!user_id) {
      res.status(400);
      throw new Error("id invaid");
    }

    // Check user permissions
    if (req.user.id !== user_id && req.user.role !== UserRole.ADMIN) {
      res.status(403);
      throw new Error("you have no rights");
    }
    const user = await usersRepository.findOne({ where: { id: user_id } });
    if (!user) {
      res.status(404);
      throw new Error("user not found");
    }

    // Soft delete the user
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
    res.status(200).json({user});
  }
);


