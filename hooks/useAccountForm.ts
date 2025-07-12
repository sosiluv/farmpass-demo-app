import { useState, useEffect, useMemo } from "react";

interface UseAccountFormOptions<T> {
  initialData: T;
  onDataChange?: (data: T) => void;
}

export function useAccountForm<T extends Record<string, any>>({
  initialData,
  onDataChange,
}: UseAccountFormOptions<T>) {
  const [formData, setFormData] = useState<T>(initialData);
  const [originalData, setOriginalData] = useState<T>(initialData);

  // initialData를 안정화하기 위해 JSON.stringify로 비교
  const stableInitialData = useMemo(
    () => initialData,
    [JSON.stringify(initialData)]
  );

  // 변경사항 감지
  const hasChanges = useMemo(() => {
    return Object.keys(formData).some(
      (key) => formData[key] !== originalData[key]
    );
  }, [formData, originalData]);

  // 초기 데이터가 변경되면 폼 데이터와 원본 데이터 업데이트
  useEffect(() => {
    setFormData(stableInitialData);
    setOriginalData(stableInitialData);
  }, [stableInitialData]);

  // 폼 데이터 변경 핸들러
  const handleChange = (field: keyof T, value: T[keyof T]) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataChange?.(newData);
  };

  // 저장 성공 후 원본 데이터 업데이트
  const resetChanges = () => {
    setOriginalData(formData);
  };

  return {
    formData,
    hasChanges,
    handleChange,
    resetChanges,
  };
}
