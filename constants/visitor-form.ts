import { User, Phone, MapPin, Car, FileText } from "lucide-react";

// 폼 필드 설정
export const FORM_FIELDS = {
  fullName: { icon: User, required: true, fullWidth: false },
  phoneNumber: { icon: Phone, required: true, fullWidth: false },
  address: { icon: MapPin, required: true, fullWidth: true },
  carPlateNumber: { icon: Car, required: false, fullWidth: false },
  visitPurpose: { icon: FileText, required: true, fullWidth: false },
  notes: { icon: FileText, required: false, fullWidth: true },
} as const;

// 방문 목적 옵션
export const VISIT_PURPOSE_OPTIONS = [
  "납품",
  "점검",
  "미팅",
  "수의사 진료",
  "사료 배송",
  "방역",
  "견학",
  "기타",
] as const;

// 라벨
export const LABELS = {
  VISIT_PURPOSE: "방문목적",
  FULL_NAME: "성명",
  PHONE_NUMBER: "연락처",
  ADDRESS: "주소",
  CAR_PLATE: "차량번호",
  DISINFECTION: "소독여부",
  NOTES: "비고",
  PROFILE_PHOTO: "프로필 사진",
  CONSENT: "개인정보 수집 및 이용에 동의합니다",
} as const;

// 플레이스홀더
export const PLACEHOLDERS = {
  FULL_NAME: "홍길동",
  PHONE_NUMBER: "숫자만 입력 가능합니다",
  CAR_PLATE: "12가3456 (선택사항)",
  VISIT_PURPOSE: "방문 목적을 선택하세요",
  NOTES: "추가 사항이 있으면 입력해주세요",
} as const;
