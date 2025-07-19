import * as z from "zod";
import {
  validatePhone,
  validateVehicleNumber,
} from "@/lib/utils/validation/validation";
import type { VisitorSettings } from "@/lib/types/visitor";

// 에러 메시지 직접 정의
const ERROR_MESSAGES = {
  REQUIRED_NAME: "성명을 입력해주세요",
  REQUIRED_CONTACT: "연락처를 입력해주세요",
  REQUIRED_ADDRESS: "주소를 검색해주세요",
  REQUIRED_PURPOSE: "방문목적을 선택해주세요",
  REQUIRED_PHOTO: "방문자 사진을 등록해주세요",
  REQUIRED_CONSENT: "개인정보 수집에 동의해주세요",
  INVALID_PHONE: "올바른 전화번호 형식(010-XXXX-XXXX)을 입력해주세요",
  INVALID_CAR_PLATE: "올바른 차량번호 형식을 입력해주세요. (예: 12가1234)",
};

/**
 * 방문자 폼 동적 스키마 생성
 * 설정값에 따라 검증 규칙이 달라집니다.
 */
export const createVisitorFormSchema = (
  settings: VisitorSettings,
  uploadedImageUrl?: string | null
) => {
  const baseSchema = z.object({
    fullName: z.string().min(1, ERROR_MESSAGES.REQUIRED_NAME),
    address: z.string().min(1, ERROR_MESSAGES.REQUIRED_ADDRESS),
    detailedAddress: z.string().optional(),
    carPlateNumber: z
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
    disinfectionCheck: z.boolean().default(false),
    notes: z.string().optional(),
    consentGiven: z.boolean().refine((val) => val === true, {
      message: ERROR_MESSAGES.REQUIRED_CONSENT,
    }),
  });

  // 설정에 따른 조건부 필드 추가
  const conditionalFields: Record<string, z.ZodTypeAny> = {};

  // 전화번호 검증 (설정에 따라 필수/선택)
  if (settings.requireVisitorContact) {
    conditionalFields.phoneNumber = z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED_CONTACT)
      .refine(validatePhone, {
        message: ERROR_MESSAGES.INVALID_PHONE,
      });
  } else {
    conditionalFields.phoneNumber = z.string().optional();
  }

  // 방문 목적 검증 (설정에 따라 필수/선택)
  if (settings.requireVisitPurpose) {
    conditionalFields.visitPurpose = z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED_PURPOSE);
  } else {
    conditionalFields.visitPurpose = z.string().optional();
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
 * 방문자 다이얼로그 폼 스키마 (관리자용)
 * API/DB 필드명과 일치하는 스키마
 */
export const visitorDialogFormSchema = z.object({
  visitor_name: z.string().min(1, ERROR_MESSAGES.REQUIRED_NAME),
  visitor_phone: z.string().min(1, ERROR_MESSAGES.REQUIRED_CONTACT),
  visitor_address: z.string().min(1, ERROR_MESSAGES.REQUIRED_ADDRESS),
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
});

/**
 * 방문자 다이얼로그 폼 데이터 타입
 */
export type VisitorDialogFormData = z.infer<typeof visitorDialogFormSchema>;
