/**
 * =================================
 * 📝 공통 폼 검증 훅
 * =================================
 * 중복된 폼 상태 관리 및 검증 로직을 통합
 */

import { useState, useCallback, useMemo } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface UseFormValidationOptions<T> {
  initialValues?: Partial<T>;
  validate?: (values: T) => FormErrors;
  onSubmit?: (values: T) => Promise<void> | void;
  onError?: (errors: FormErrors) => void;
  resetOnSubmitSuccess?: boolean;
}

export interface UseFormValidationResult<T> {
  values: T;
  errors: FormErrors;
  isSubmitting: boolean;
  isValid: boolean;

  // 값 관리
  setValue: (field: keyof T, value: any) => void;
  setValues: (newValues: Partial<T>) => void;
  resetValues: () => void;

  // 에러 관리
  setError: (field: keyof T, error?: string) => void;
  setErrors: (newErrors: FormErrors) => void;
  clearErrors: () => void;
  clearError: (field: keyof T) => void;

  // 검증 및 제출
  validate: () => boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;

  // 헬퍼
  getFieldError: (field: keyof T) => string | undefined;
  hasError: (field: keyof T) => boolean;
  hasAnyError: boolean;
}

/**
 * 폼 검증 및 상태 관리 훅
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  options: UseFormValidationOptions<T> = {}
): UseFormValidationResult<T> {
  const { validate, onSubmit, onError, resetOnSubmitSuccess = true } = options;

  const toast = useCommonToast();
  const [values, setValuesState] = useState<T>({
    ...initialValues,
    ...options.initialValues,
  });
  const [errors, setErrorsState] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 값 관리
  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValuesState((prev) => ({ ...prev, [field]: value }));
      // 값이 변경되면 해당 필드의 에러 제거
      if (errors[field as string]) {
        setErrorsState((prev) => ({ ...prev, [field as string]: undefined }));
      }
    },
    [errors]
  );

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
  }, []);

  const resetValues = useCallback(() => {
    setValuesState({ ...initialValues });
    setErrorsState({});
  }, [initialValues]);

  // 에러 관리
  const setError = useCallback((field: keyof T, error?: string) => {
    setErrorsState((prev) => ({ ...prev, [field as string]: error }));
  }, []);

  const setErrors = useCallback((newErrors: FormErrors) => {
    setErrorsState(newErrors);
  }, []);

  const clearErrors = useCallback(() => {
    setErrorsState({});
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrorsState((prev) => ({ ...prev, [field as string]: undefined }));
  }, []);

  // 검증
  const validateForm = useCallback((): boolean => {
    if (!validate) return true;

    const validationErrors = validate(values);
    setErrorsState(validationErrors);

    const hasErrors = Object.values(validationErrors).some(
      (error) => error !== undefined
    );

    if (hasErrors && onError) {
      onError(validationErrors);
    }

    return !hasErrors;
  }, [values, validate, onError]);

  // 제출
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        const isValid = validateForm();

        if (!isValid) {
          toast.showError("UNKNOWN_ERROR"); // 또는 다른 적절한 에러 메시지
          return;
        }

        if (onSubmit) {
          await onSubmit(values);

          if (resetOnSubmitSuccess) {
            resetValues();
          }
        }
      } catch (error) {
        devLog.error("Form submission error:", error);
        toast.showCustomError("제출 실패", "폼 제출 중 오류가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      validateForm,
      onSubmit,
      values,
      resetOnSubmitSuccess,
      resetValues,
      toast,
    ]
  );

  // 헬퍼
  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      return errors[field as string];
    },
    [errors]
  );

  const hasError = useCallback(
    (field: keyof T): boolean => {
      return !!errors[field as string];
    },
    [errors]
  );

  // 계산된 값들
  const hasAnyError = useMemo(() => {
    return Object.values(errors).some((error) => error !== undefined);
  }, [errors]);

  const isValid = useMemo(() => {
    return !hasAnyError;
  }, [hasAnyError]);

  return {
    values,
    errors,
    isSubmitting,
    isValid,
    setValue,
    setValues,
    resetValues,
    setError,
    setErrors,
    clearErrors,
    clearError,
    validate: validateForm,
    handleSubmit,
    getFieldError,
    hasError,
    hasAnyError,
  };
}

/**
 * 간단한 필드 검증 함수들
 */
export const validators = {
  required: (value: any, message = "이 필드는 필수입니다.") => {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return message;
    }
    return undefined;
  },

  email: (value: string, message = "올바른 이메일 주소를 입력해주세요.") => {
    if (!value) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return message;
    }
    return undefined;
  },

  minLength: (min: number, message?: string) => (value: string) => {
    if (!value) return undefined;
    if (value.length < min) {
      return message || `최소 ${min}자 이상 입력해주세요.`;
    }
    return undefined;
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (!value) return undefined;
    if (value.length > max) {
      return message || `최대 ${max}자까지 입력 가능합니다.`;
    }
    return undefined;
  },

  phone: (value: string, message = "올바른 전화번호를 입력해주세요.") => {
    if (!value) return undefined;
    const phoneRegex = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/;
    if (!phoneRegex.test(value)) {
      return message;
    }
    return undefined;
  },
};

/**
 * 여러 검증 함수를 결합하는 헬퍼
 */
export function combineValidators(
  ...validators: Array<(value: any) => string | undefined>
) {
  return (value: any): string | undefined => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  };
}
