export const EMPLOYEE_COUNT_OPTIONS = [
  { value: "10", label: "1-10명" },
  { value: "50", label: "10-50명" },
  { value: "100", label: "50-100명" },
  { value: "500", label: "100명 이상" },
] as const;

export const BUSINESS_TYPE_OPTIONS = [
  { value: "축산업", label: "축산업" },
  { value: "농업", label: "농업" },
  { value: "원예업", label: "원예업" },
  { value: "수산업", label: "수산업" },
  { value: "기타", label: "기타" },
] as const;
