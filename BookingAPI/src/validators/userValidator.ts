import { object, string, number } from "yup";
import { UserRole } from "../entity/user";

export const phone_regex = /^\+\d{1,4}\(\d{1,5}\)\d{5,7}$/;

export const userCreateSchema = object({
  email: string().email().required(),
  role: string().oneOf(Object.values(UserRole)).required(),
  password: string().min(8).max(20).required(),
});

const loginbaseSchema = object().shape({
  password: string().min(8).max(20).required(),
})
export const userLoginEmailSchema = loginbaseSchema.concat(object({
  email:string().email().required(),
})
);
export const userLoginPhoneSchema = loginbaseSchema.concat(object({
  phone_number: string().matches(phone_regex, { excludeEmptyString: true }),
})
);

export const userPutSchema = object({
  user_id: number().min(1).integer().required(),
  firstname: string().min(5).max(40),
  lastname: string().min(5).max(40),
  phone_number: string().matches(phone_regex, { excludeEmptyString: true }),
  email: string().email(),
});
