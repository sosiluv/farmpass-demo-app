import * as z from "zod";
import { isValidFarmType } from "@/lib/constants/farm-types";
import { validatePhone } from "@/lib/utils/validation/validation";
import { ERROR_MESSAGES } from "@/lib/constants/farms";

export const farmFormSchema = z.object({
  farm_name: z.string().min(1, ERROR_MESSAGES.REQUIRED_FARM_NAME),
  farm_address: z.string().min(1, ERROR_MESSAGES.REQUIRED_FARM_ADDRESS),
  farm_detailed_address: z.string().optional(),
  farm_type: z
    .string({
      required_error: ERROR_MESSAGES.REQUIRED_FARM_TYPE,
    })
    .refine((value) => isValidFarmType(value), {
      message: ERROR_MESSAGES.INVALID_FARM_TYPE,
    }),
  description: z.string().optional(),
  manager_name: z
    .string({
      required_error: ERROR_MESSAGES.REQUIRED_MANAGER_NAME,
    })
    .min(2, ERROR_MESSAGES.INVALID_MANAGER_NAME),
  manager_phone: z
    .string({
      required_error: ERROR_MESSAGES.REQUIRED_MANAGER_PHONE,
    })
    .refine((value) => validatePhone(value), {
      message: ERROR_MESSAGES.INVALID_MANAGER_PHONE,
    }),
});

export type FarmFormValues = z.infer<typeof farmFormSchema>;
