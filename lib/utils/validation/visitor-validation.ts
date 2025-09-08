import * as z from "zod";
import {
  validatePhone,
  validateVehicleNumber,
} from "@/lib/utils/validation/validation";
import type { VisitorSettings } from "@/lib/types/visitor";
import { ERROR_MESSAGES } from "@/lib/constants/visitor";

/**
 * 방문자 폼 동적 스키마 생성
 * 설정값에 따라 검증 규칙이 달라집니다.
 * DB 필드명과 일치하도록 수정됨
 */
export const createVisitorFormSchema = (
  settings: VisitorSettings,
  uploadedImageUrl?: string | null
) => {
  const baseSchema = z.object({
    visitor_name: z.string().min(1, ERROR_MESSAGES.REQUIRED_NAME),
    visitor_address: z.string().min(1, ERROR_MESSAGES.REQUIRED_ADDRESS),
    detailed_address: z.string().optional(),
    vehicle_number: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (!value || value.trim().length === 0) return true;
          return validateVehicleNumber(value).isValid;
        },
        {
          message: ERROR_MESSAGES.INVALID_CAR_PLATE,
        }
      ),
    disinfection_check: z.boolean().default(false),
    notes: z.string().optional(),
    consent_given: z.boolean().refine((val) => val === true, {
      message: ERROR_MESSAGES.REQUIRED_CONSENT,
    }),
    profile_photo_url: z.string().nullable().optional(),
  });

  // 설정에 따른 조건부 필드 추가
  const conditionalFields: Record<string, z.ZodTypeAny> = {};

  // 전화번호 검증 (설정에 따라 필수/선택)
  if (settings.requireVisitorContact) {
    conditionalFields.visitor_phone = z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED_CONTACT)
      .refine(validatePhone, {
        message: ERROR_MESSAGES.INVALID_PHONE,
      });
  } else {
    conditionalFields.visitor_phone = z.string().optional();
  }

  // 방문 목적 검증 (설정에 따라 필수/선택)
  if (settings.requireVisitPurpose) {
    conditionalFields.visitor_purpose = z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED_PURPOSE);
  } else {
    conditionalFields.visitor_purpose = z.string().optional();
  }

  // 프로필 사진은 폼 외부에서 처리하므로 스키마에서 제거
  // 이미지 검증은 별도 로직으로 처리

  return baseSchema.extend(conditionalFields);
};

/**
 * 방문자 폼 데이터 타입 (설정에 따라 동적)
 */
export type VisitorFormData = z.infer<
  ReturnType<typeof createVisitorFormSchema>
>;

/**
 * 방문자 시트 폼 스키마 (관리자용)
 * API/DB 필드명과 일치하는 스키마
 */
export const updateVisitorFormSchema = z.object({
  id: z.string().optional(), // 수정 시에만 사용
  farm_id: z.string().optional(), // 수정 시에만 사용
  visitor_name: z.string().min(1, ERROR_MESSAGES.REQUIRED_NAME),
  visitor_phone: z.string().min(1, ERROR_MESSAGES.REQUIRED_CONTACT),
  visitor_address: z.string().min(1, ERROR_MESSAGES.REQUIRED_ADDRESS),
  detailed_address: z.string().optional(),
  visitor_purpose: z.string().nullable(),
  vehicle_number: z
    .string()
    .nullable()
    .refine(
      (value) => {
        if (!value || value.trim().length === 0) return true;
        return validateVehicleNumber(value).isValid;
      },
      {
        message: ERROR_MESSAGES.INVALID_CAR_PLATE,
      }
    ),
  notes: z.string().nullable(),
  disinfection_check: z.boolean(),
  consent_given: z.boolean().refine((val) => val === true, {
    message: ERROR_MESSAGES.REQUIRED_CONSENT,
  }),
});

/**
 * 방문자 시트 폼 데이터 타입
 */
export type VisitorSheetFormData = z.infer<typeof updateVisitorFormSchema>;
