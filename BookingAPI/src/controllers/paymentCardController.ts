import { UserRequest } from "../interfaces/UserRequest";
import { Response } from "express";
import asyncHandler from "express-async-handler";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entity/user";
import { payCardAddSchema, payCardDeleteSchema } from "../validators/paymentCardValidator";
import { paymentCard } from "../entity/paymentCard";

const userRepository = AppDataSource.getRepository(User);
const payCardRepository = AppDataSource.getRepository(paymentCard);

export const addCard = asyncHandler(async (req: UserRequest, res: Response) => {
  try {
    const { user_id, card_number, date, owner_name } = req.body;
    try {
      await payCardAddSchema.validate({
        user_id,
        card_number,
        date,
        owner_name,
      });
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }
    const user: User = await userRepository.findOne({where:{ id: user_id },relations:{pay_card:true}});
    if (user_id != req.user.id) {
      res.status(403);
      throw new Error("Permission denied");
    }
    if (!user) {
      throw new Error("User not found");
    }

    const existed_card: paymentCard = await payCardRepository.findOne({where:[{ card_number,date },{user}],relations:{user:true}});
    if (existed_card){
      throw new Error("this card already exist or user had linked card")
    }
    const payCard: paymentCard = await payCardRepository.create({
      owner_name,
      card_number,
      date,
      user,
    });
    await payCardRepository.save(payCard);
    res.status(200).json({ status: "create successfully" });
  } catch (err) {
    if (res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(err.message);
  }
});

export const deleteCard = asyncHandler(async (req: UserRequest, res: Response) => {
  try {
    const {card_id} = req.body;
    try {
      await payCardDeleteSchema.validate({
        card_id
      });
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }

    const payCard: paymentCard = await payCardRepository.findOne({where:{id:card_id},relations:{user:true}})
    if (!payCard?.user) {
      res.status(404);
      throw new Error("Card not found");
    }
    if (req.user.id !== payCard.user.id && req.user.role !== UserRole.ADMIN) {
      res.status(403);
      throw new Error("Permission denied");
    }
    payCard.user = null
    const resault = await payCardRepository.save(payCard)
    console.log(resault)
    res.status(200).json({ status: "delete successfully" });
  } catch (err) {
    if (res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(err.message);
  }
});
