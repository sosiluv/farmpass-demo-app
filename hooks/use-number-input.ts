import { ChangeEvent, useState, useCallback, useMemo } from "react";
import { INPUT_VALIDATION_RULES } from "@/lib/constants/defaults";

type NumberInputKey = keyof typeof INPUT_VALIDATION_RULES;

export function useNumberInput(key: NumberInputKey) {
  const rules = INPUT_VALIDATION_RULES[key];
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement>,
      onChange: (value: number) => void,
      onDisplayChange?: (value: string) => void
    ) => {
      const value = e.target.value;
      setIsEditing(true);

      // 디스플레이 값 업데이트 (입력 중인 값을 그대로 표시)
      if (onDisplayChange) {
        onDisplayChange(value);
      }

      // 빈 값 허용 (사용자가 완전히 지우고 새로 입력할 수 있도록)
      if (value === "" || value === "-") {
        return; // 실제 값은 변경하지 않음
      }

      const num = parseInt(value);

      // 숫자가 아닌 값이 입력될 때는 무시
      if (isNaN(num)) {
        return;
      }

      // 범위 내의 값만 실제로 저장
      if (num >= rules.min && num <= rules.max) {
        onChange(num);
      }
      // 범위를 벗어나는 값은 표시만 하고 저장하지 않음
    },
    [rules.min, rules.max]
  );

  const handleBlur = useCallback(
    (
      currentValue: string,
      onChange: (value: number) => void,
      onDisplayChange?: (value: string) => void
    ) => {
      setIsEditing(false);

      // 포커스를 잃을 때 유효성 검사
      if (currentValue === "" || currentValue === "-") {
        // 빈 값이면 기본값으로 설정
        onChange(rules.defaultValue);
        if (onDisplayChange) {
          onDisplayChange(rules.defaultValue.toString());
        }
        return;
      }

      const num = parseInt(currentValue);

      if (isNaN(num)) {
        // 잘못된 값이면 기본값으로 설정
        onChange(rules.defaultValue);
        if (onDisplayChange) {
          onDisplayChange(rules.defaultValue.toString());
        }
        return;
      }

      // 범위를 벗어나면 가장 가까운 유효한 값으로 조정
      if (num < rules.min) {
        onChange(rules.min);
        if (onDisplayChange) {
          onDisplayChange(rules.min.toString());
        }
      } else if (num > rules.max) {
        onChange(rules.max);
        if (onDisplayChange) {
          onDisplayChange(rules.max.toString());
        }
      } else {
        onChange(num);
        if (onDisplayChange) {
          onDisplayChange(num.toString());
        }
      }
    },
    [rules.min, rules.max, rules.defaultValue]
  );

  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  return useMemo(
    () => ({
      handleChange,
      handleBlur,
      handleFocus,
      min: rules.min,
      max: rules.max,
      defaultValue: rules.defaultValue,
      isEditing,
    }),
    [
      handleChange,
      handleBlur,
      handleFocus,
      rules.min,
      rules.max,
      rules.defaultValue,
      isEditing,
    ]
  );
}
