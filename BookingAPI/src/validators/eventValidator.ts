import { object, string, number, date } from "yup";
import { UserRole } from "../entity/user";
import { min } from "class-validator";
import { test } from "node:test";

export const eventCreateSchema = object({
  role: string().oneOf([UserRole.ADMIN, UserRole.ORGANIZER]).required(),
  venue_id: number().integer().min(0).required(),
  name: string().min(3).max(50).required(),
  price: number().min(0).integer().required(),
  date_start: date(),
  date_end: date(),
  description: string().min(50).required(),
  event_type: string().min(3).max(50).required(),
})
.test("date-compare", "Validation failure", function (values) {
  const { date_start, date_end } = values;
  if (date_start && date_end) {
    const startTime: number = new Date(date_start).getTime();
    const endTime: number = new Date(date_end).getTime();
    const realTime: number = new Date().getTime();
    if (startTime > endTime) {
      return this.createError({
        path: "date_start",
        message: "Start date cannot be greater than end date",
      });
    }
    if (realTime > startTime) {
      return this.createError({
        path: "date_start",
        message: "Start date cannot be less than real date",
      });
    }
  }
  return true;
});

export const eventUpdateSchema = object({
  role: string().oneOf([UserRole.ADMIN, UserRole.ORGANIZER]).required(),
  event_id: number().integer().min(0),
  venue_id: number().integer().min(0),
  name: string().min(3).max(50),
  price: number().min(0).integer(),
  date_start: date(),
  date_end: date(),
  description: string().min(50),
  event_type: string().min(3).max(50),
});

export const eventSearchSchema = object({
  skip: number().integer().min(0).max(50).required(),
  take: number().min(0).integer(),
  address: string().min(5).required(),
  name: string().min(3).max(50),
  price_min: number().integer().min(0),
  price_max: number().integer().min(0),
  venue_id: number().integer().min(0),
  date_start: date(),
  date_end: date(),
  event_type: string().min(3).max(50),
});
