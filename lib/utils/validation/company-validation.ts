import * as z from "zod";

/**
 * 회사 정보 폼 스키마
 * - 현재 UI 동작과의 호환성을 위해 필드들은 널러블/옵셔널 문자열로 정의합니다.
 * - 구체 검증(예: URL, 숫자, 날짜)은 서버 라우트에서 재검증하거나 추후 강화 가능합니다.
 */
export const companyFormSchema = z.object({
  companyName: z.string().nullable().optional(),
  companyAddress: z.string().nullable().optional(),
  businessType: z.string().nullable().optional(),
  company_description: z.string().nullable().optional(),
  establishment_date: z.string().nullable().optional(),
  employee_count: z.string().nullable().optional(),
  company_website: z.string().nullable().optional(),
});

export type CompanyFormData = z.infer<typeof companyFormSchema>;
