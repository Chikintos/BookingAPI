import { UserRequest } from "../interfaces/UserRequest";
import { Response } from "express";
import asyncHandler from "express-async-handler";
import { reviewCreateSchema } from "../validators/reviewValidator";
import { Check_Profanity } from "../scripts/scripts";
import { AppDataSource } from "../data-source";
import { Venue } from "../entity/venue";
import { User, UserRole } from "../entity/user";
import { Review } from "../entity/review";
import { number } from "yup";

// Access repositories from the data source
const venueRepository = AppDataSource.getRepository(Venue);
const userRepository = AppDataSource.getRepository(User);
const reviewRepository = AppDataSource.getRepository(Review);

//handler to create a review
export const ReviewCreate = asyncHandler(
  async (req: UserRequest, res: Response) => {
    let { venue_id, rate, comment } = req.body;
    try {
      await reviewCreateSchema.validate({
        role: req.user.role,
        venue_id,
        user_id: req.user.id,
        rate,
        comment,
      });
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }
    try {
      const venue = await venueRepository.findOneBy({ id: venue_id });
      const user = await userRepository.findOneBy({ id: req.user.id });
      if (!venue) {
        res.status(404);
        throw new Error("Venue not found");
      }
      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }

      // Check if the user reached the maximum number of comments
      const usersReview  = await reviewRepository.countBy({user})
      if (usersReview === 2){
        throw new Error("Max number of comments for user is reached")
      }

      // Create and save the review
      const review: Review = await reviewRepository.create({
        rate,
        comment,
        venue,
        user,
      });
      const created_review: Review = await reviewRepository.save(review);
      res.status(201).json({ "review_id": created_review.id });
    } catch (err) {
      if (res.statusCode === 200) {
        res.status(500);
      }
      throw new Error(err);
    }
  }
);

//handler to get reviews for a venue
export const ReviewGetVenue = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const take: number = 10;
    const skip: number = parseInt(req.body.skip) || 0;
    const id: number = parseInt(req.params.id);
    const venue: Venue = await venueRepository.findOneBy({ id });
    if (!venue) {
      res.status(404);
      throw new Error("Venue not found");
    }
    // Find comments for the venue
    const comments: Review[] = await reviewRepository.find({
      where: { venue },
      skip,
      take,
      relations: { user: true },
      select: { user: { id: true } },
    });
    res.json({ venue_id: id, comments });
  }
);

//handler to get reviews for a user
export const ReviewGetUser = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const take: number = 10;
    const skip: number = parseInt(req.body.skip) || 0;
    const id: number = parseInt(req.params.id);
    const user: User = await userRepository.findOneBy({ id });
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    // Check user permissions
    if (req.user.role != UserRole.ADMIN && req.user.id != user.id) {
      res.status(403);
      throw new Error("Not permission");
    }
    // Find comments for the user
    const comments: Review[] = await reviewRepository.find({
      where: { user },
      skip,
      take,
    });
    res.json({ user_id: id, skip, comments });
  }
);

//handler to delete a review
export const ReviewDelete = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const id: number = parseInt(req.params.id);
    const comment: Review = await reviewRepository.findOneBy({ id });
    
    // Check user permissions
    if (req.user.role != UserRole.ADMIN && req.user.id != comment.user.id) {
      res.status(403);
      throw new Error("Not permission");
    }
    if (!comment) {
      res.status(404);
      throw new Error("review not found");
    }

    // Remove the review
    await reviewRepository.remove(comment);
    res.json({ status: "delete" });
  }
);

//handler to get a specific review
export const ReviewGet = asyncHandler(
    async (req: UserRequest, res: Response) => {
      const id: number = parseInt(req.params.id);


      const comment: Review = await reviewRepository.findOne({
        where: { id },
        relations:{user:true,venue:true},
        select: { user: { id: true },venue:{id:true} },

      });
      res.json({comment});
    }
  );