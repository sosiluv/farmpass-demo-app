import * as z from "zod";
import {
  validatePhone,
  validateName,
  validateEmail,
} from "@/lib/utils/validation/validation";
import { ERROR_MESSAGES } from "@/lib/constants/auth";

export const nameSchema = z
  .string()
  .min(1, ERROR_MESSAGES.REQUIRED_NAME)
  .refine((name) => validateName(name).isValid, {
    message: ERROR_MESSAGES.INVALID_NAME,
  });

export const emailSchema = z
  .string()
  .min(1, ERROR_MESSAGES.REQUIRED_EMAIL)
  .refine((email) => validateEmail(email).isValid, {
    message: ERROR_MESSAGES.INVALID_EMAIL,
  });

export const phoneNumberSchema = z
  .string()
  .min(1, ERROR_MESSAGES.REQUIRED_PHONE)
  .refine((phone) => validatePhone(phone), {
    message: ERROR_MESSAGES.INVALID_PHONE,
  });

export const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phoneNumber: phoneNumberSchema,
});
