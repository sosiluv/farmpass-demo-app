import * as z from "zod";
import { isValidFarmType } from "@/lib/constants/farm-types";
import { validatePhone } from "@/lib/utils/validation/validation";

export const farmFormSchema = z.object({
  farm_name: z.string().min(1, "농장 이름을 입력해주세요"),
  farm_address: z.string().min(1, "농장 주소를 입력해주세요"),
  farm_detailed_address: z.string().optional(),
  farm_type: z
    .string({
      required_error: "농장 유형을 선택해주세요",
    })
    .refine((value) => isValidFarmType(value), {
      message: "올바른 농장 유형을 선택해주세요",
    }),
  description: z.string().optional(),
  manager_name: z
    .string({
      required_error: "관리자 이름을 입력해주세요",
    })
    .min(2, "관리자 이름은 2자 이상 입력해주세요"),
  manager_phone: z
    .string({
      required_error: "관리자 연락처를 입력해주세요",
    })
    .refine((value) => validatePhone(value), {
      message: "올바른 전화번호 형식(010-XXXX-XXXX)을 입력해주세요",
    }),
});

export type FarmFormValues = z.infer<typeof farmFormSchema>;
