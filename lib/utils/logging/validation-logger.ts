import { logValidationError } from "./system-log";
import { devLog } from "./dev-logger";
import { PHONE_PATTERN } from "@/lib/constants/input-rules";

/**
 * 방문자 폼 유효성 검사 통합 로깅 시스템
 * 개별 필드 에러 대신 종합적인 검증 결과를 로깅
 */

export interface ValidationError {
  field: string;
  value: any;
  message: string;
  errorType: string;
}

export interface ValidationSummary {
  formType: string;
  totalFields: number;
  failedFields: string[];
  errors: ValidationError[];
  completionRate: number;
  userId?: string;
  farmId?: string;
}

/**
 * 방문자 폼 유효성 검사 결과 통합 로깅
 */
export async function logValidationSummary(
  summary: ValidationSummary
): Promise<void> {
  try {
    // 에러가 없는 경우 로깅하지 않음 (성공적인 검증은 별도 로깅 불필요)
    if (summary.errors.length === 0) {
      return;
    }

    // 심각도 계산
    const severity = calculateValidationSeverity(summary);

    // 통합 로그 생성
    await logValidationError(
      `${summary.formType}_validation_summary`,
      {
        failed_fields: summary.failedFields,
        total_errors: summary.errors.length,
        completion_rate: summary.completionRate,
      },
      `${summary.formType} 폼 검증 실패: ${summary.failedFields.join(", ")} (${
        summary.errors.length
      }개 오류, 완성도: ${Math.round(summary.completionRate * 100)}%)`,
      summary.userId
    );

    devLog.warn(`[VALIDATION_SUMMARY] ${summary.formType} 폼 검증 실패:`, {
      failed_fields: summary.failedFields,
      error_count: summary.errors.length,
      completion_rate: summary.completionRate,
      severity,
      details: summary.errors,
    });
  } catch (error) {
    devLog.error("[VALIDATION_SUMMARY] 유효성 검사 로그 생성 실패:", error);
  }
}

/**
 * 유효성 검사 심각도 계산
 */
function calculateValidationSeverity(
  summary: ValidationSummary
): "low" | "medium" | "high" {
  const errorRate = summary.errors.length / summary.totalFields;

  if (errorRate >= 0.7) return "high"; // 70% 이상 실패
  if (errorRate >= 0.3) return "medium"; // 30% 이상 실패
  return "low"; // 30% 미만 실패
}

/**
 * 방문자 폼용 유효성 검사 헬퍼
 */
export class VisitorFormValidator {
  private errors: ValidationError[] = [];
  private userId?: string;
  private farmId?: string;

  constructor(userId?: string, farmId?: string) {
    this.userId = userId;
    this.farmId = farmId;
  }

  /**
   * 개별 필드 검증 및 에러 수집
   */
  validateField(
    field: string,
    value: any,
    validator: (value: any) => {
      isValid: boolean;
      message?: string;
      errorType?: string;
    }
  ): boolean {
    const result = validator(value);

    if (!result.isValid) {
      this.errors.push({
        field,
        value: this.maskSensitiveData(field, value),
        message: result.message || "유효하지 않은 값",
        errorType: result.errorType || "validation_failed",
      });
    }

    return result.isValid;
  }

  /**
   * 필수 필드 검증
   */
  validateRequired(field: string, value: any): boolean {
    return this.validateField(field, value, (val) => ({
      isValid: val !== null && val !== undefined && val !== "",
      message: `${field}은(는) 필수 입력 항목입니다`,
      errorType: "required_field_missing",
    }));
  }

  /**
   * 전화번호 형식 검증
   */
  validatePhone(value: string): boolean {
    return this.validateField("phone", value, (val) => {
      return {
        isValid: PHONE_PATTERN.test(val || ""),
        message: "올바른 전화번호 형식(010-XXXX-XXXX)을 입력해주세요",
        errorType: "invalid_phone_format",
      };
    });
  }

  /**
   * 차량번호 형식 검증
   */
  validateVehicleNumber(value: string): boolean {
    return this.validateField("vehicle_number", value, (val) => {
      if (!val) return { isValid: true }; // 선택 필드

      const vehicleRegex = /^[0-9]{2,3}[가-힣][0-9]{4}$/;
      return {
        isValid: vehicleRegex.test(val),
        message: "올바른 차량번호 형식이 아닙니다 (예: 12가3456)",
        errorType: "invalid_vehicle_format",
      };
    });
  }

  /**
   * 검증 완료 및 결과 로깅
   */
  async finalize(totalFields: number): Promise<boolean> {
    const completionRate = (totalFields - this.errors.length) / totalFields;

    if (this.errors.length > 0) {
      await logValidationSummary({
        formType: "visitor_registration",
        totalFields,
        failedFields: this.errors.map((e) => e.field),
        errors: this.errors,
        completionRate,
        userId: this.userId,
        farmId: this.farmId,
      });
    }

    return this.errors.length === 0;
  }

  /**
   * 현재 에러 목록 조회
   */
  getErrors(): ValidationError[] {
    return [...this.errors];
  }

  /**
   * 에러 초기화
   */
  reset(): void {
    this.errors = [];
  }

  /**
   * 민감한 데이터 마스킹
   */
  private maskSensitiveData(field: string, value: any): any {
    if (typeof value !== "string") return value;

    switch (field) {
      case "phone":
        return value.replace(/(\d{3})-?(\d{4})-?(\d{4})/, "$1-****-$3");
      case "name":
        return value.length > 1
          ? value[0] + "*".repeat(value.length - 1)
          : value;
      default:
        return value;
    }
  }
}

/**
 * 폼 완성도 기반 사용자 경험 개선 제안
 */
export function getValidationGuidance(completionRate: number): {
  message: string;
  severity: "info" | "warning" | "error";
  suggestions: string[];
} {
  if (completionRate >= 0.8) {
    return {
      message: "거의 완성되었습니다!",
      severity: "info",
      suggestions: ["나머지 필드를 확인해주세요"],
    };
  }

  if (completionRate >= 0.5) {
    return {
      message: "절반 정도 완성되었습니다",
      severity: "warning",
      suggestions: [
        "필수 항목을 우선 작성해주세요",
        "전화번호 형식을 확인해주세요",
      ],
    };
  }

  return {
    message: "입력 정보를 확인해주세요",
    severity: "error",
    suggestions: [
      "모든 필수 항목을 작성해주세요",
      "올바른 형식으로 입력해주세요",
      "개인정보 동의를 확인해주세요",
    ],
  };
}
