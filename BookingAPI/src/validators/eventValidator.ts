import { object, string, number, date, array } from "yup";
import { UserRole } from "../entity/user";
import { min } from "class-validator";
import moment from "moment";

function Check_date(context,val) {
  if (!val) {
    return true;
  }
  if (!date_regex.test(val)) {
    return context.createError({
      path: "date_start",
      message: `invalid format. regex - ${date_regex}`,
    });
  }
  const date: Date = new Date(val);
  if (date.getTime() <= new Date().getTime()) {
    console.log(date <= new Date(), date, new Date());
    return context.createError({
      path: "date_start",
      message: `date can't be less that actual date`,
    });
  }
  return true;
}

const date_regex = /\d{4}-[01]\d-[0-3]\d [0-2]\d:[0-5]\d(?:\.\d+)?$/;

export const eventCreateSchema = object({
  role: string().oneOf([UserRole.ADMIN, UserRole.ORGANIZER]).required(),
  venue_id: number().integer().min(0).required(),
  name: string().min(3).max(50).required(),
  price: number().min(0).integer().required(),
  date_start: date(),
  date_end: date(),
  description: string().min(50).required(),
  event_type: string().min(3).max(50).required(),
}).test("date-compare", "Validation failure", function (values) {
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
  skip: number().integer().min(0).max(50),
  take: number().min(0).integer(),
  address: string().min(5),
  name: string().min(3).max(50),
  price_min: number().integer().min(0),
  price_max: number().integer().min(0),
  venue_id: array().of(number().integer()),
  date_start: string().test(
    "date validation",
    "Invalid date or format.",
    (val,testContext) => {
      return Check_date(testContext, val);
    }

  ),
  date_end: string().test(
    "date validation",
    "Invalid date or format.",
    (val,testContext) => {
      return Check_date(testContext, val);
    }

  ),
  event_type: string().min(3).max(50),
});
