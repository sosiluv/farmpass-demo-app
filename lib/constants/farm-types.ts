import {
  Mountain,
  PiggyBank,
  Bird,
  Rabbit,
  Milk,
  Wheat,
  Fish,
  Flower2,
  Apple,
  Grape,
  Carrot,
  Sprout,
  HelpCircle,
} from "lucide-react";

// 농장 유형 정의
export const FARM_TYPES = {
  // 축산업
  CATTLE: "cattle", // 소
  DAIRY: "dairy", // 낙농
  PIGS: "pigs", // 돼지
  POULTRY: "poultry", // 가금류
  SHEEP_GOAT: "sheep_goat", // 양/염소

  // 경종업
  RICE: "rice", // 벼농사
  GRAIN: "grain", // 곡물
  VEGETABLE: "vegetable", // 채소
  FRUIT: "fruit", // 과수
  FLOWER: "flower", // 화훼
  MUSHROOM: "mushroom", // 버섯
  SPECIAL_CROP: "special_crop", // 특용작물

  // 기타
  MIXED: "mixed", // 복합영농
  GREENHOUSE: "greenhouse", // 시설원예
  SEED: "seed", // 종자
  AQUACULTURE: "aquaculture", // 수산업
  OTHER: "other", // 기타
} as const;

export type FarmType = (typeof FARM_TYPES)[keyof typeof FARM_TYPES];

// 농장 유형별 한국어 라벨
export const FARM_TYPE_LABELS: Record<FarmType, string> = {
  // 축산업
  [FARM_TYPES.CATTLE]: "소 (한우/육우)",
  [FARM_TYPES.DAIRY]: "낙농 (젖소)",
  [FARM_TYPES.PIGS]: "양돈",
  [FARM_TYPES.POULTRY]: "가금류 (닭/오리)",
  [FARM_TYPES.SHEEP_GOAT]: "양/염소",

  // 경종업
  [FARM_TYPES.RICE]: "벼농사",
  [FARM_TYPES.GRAIN]: "곡물",
  [FARM_TYPES.VEGETABLE]: "채소",
  [FARM_TYPES.FRUIT]: "과수",
  [FARM_TYPES.FLOWER]: "화훼",
  [FARM_TYPES.MUSHROOM]: "버섯",
  [FARM_TYPES.SPECIAL_CROP]: "특용작물",

  // 기타
  [FARM_TYPES.MIXED]: "복합영농",
  [FARM_TYPES.GREENHOUSE]: "시설원예",
  [FARM_TYPES.SEED]: "종자",
  [FARM_TYPES.AQUACULTURE]: "수산업",
  [FARM_TYPES.OTHER]: "기타",
} as const;

// 농장 유형별 아이콘
export const FARM_TYPE_ICONS: Record<FarmType, any> = {
  [FARM_TYPES.CATTLE]: Mountain, // 소 농장
  [FARM_TYPES.PIGS]: PiggyBank, // 돼지 농장
  [FARM_TYPES.POULTRY]: Bird, // 가금류 농장
  [FARM_TYPES.SHEEP_GOAT]: Rabbit, // 양/염소 농장
  [FARM_TYPES.DAIRY]: Milk, // 낙농업
  [FARM_TYPES.RICE]: Wheat, // 벼농사
  [FARM_TYPES.GRAIN]: Sprout, // 곡물
  [FARM_TYPES.VEGETABLE]: Carrot, // 채소
  [FARM_TYPES.FRUIT]: Apple, // 과수
  [FARM_TYPES.FLOWER]: Flower2, // 화훼
  [FARM_TYPES.MUSHROOM]: Sprout, // 버섯
  [FARM_TYPES.SPECIAL_CROP]: Wheat, // 특용작물
  [FARM_TYPES.MIXED]: Grape, // 복합영농
  [FARM_TYPES.GREENHOUSE]: Flower2, // 시설원예
  [FARM_TYPES.SEED]: Sprout, // 종자
  [FARM_TYPES.AQUACULTURE]: Fish, // 수산업
  [FARM_TYPES.OTHER]: HelpCircle, // 기타
};

// 농장 유형별 색상 (배지용)
export const FARM_TYPE_COLORS: Record<FarmType, string> = {
  [FARM_TYPES.CATTLE]: "bg-red-100 text-red-800 border-red-200",
  [FARM_TYPES.PIGS]: "bg-pink-100 text-pink-800 border-pink-200",
  [FARM_TYPES.POULTRY]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [FARM_TYPES.SHEEP_GOAT]: "bg-gray-100 text-gray-800 border-gray-200",
  [FARM_TYPES.DAIRY]: "bg-blue-100 text-blue-800 border-blue-200",
  [FARM_TYPES.RICE]: "bg-green-100 text-green-800 border-green-200",
  [FARM_TYPES.GRAIN]: "bg-amber-100 text-amber-800 border-amber-200",
  [FARM_TYPES.VEGETABLE]: "bg-green-100 text-green-800 border-green-200",
  [FARM_TYPES.FRUIT]: "bg-red-100 text-red-800 border-red-200",
  [FARM_TYPES.FLOWER]: "bg-purple-100 text-purple-800 border-purple-200",
  [FARM_TYPES.MUSHROOM]: "bg-orange-100 text-orange-800 border-orange-200",
  [FARM_TYPES.SPECIAL_CROP]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [FARM_TYPES.MIXED]: "bg-indigo-100 text-indigo-800 border-indigo-200",
  [FARM_TYPES.GREENHOUSE]: "bg-emerald-100 text-emerald-800 border-emerald-200",
  [FARM_TYPES.SEED]: "bg-lime-100 text-lime-800 border-lime-200",
  [FARM_TYPES.AQUACULTURE]: "bg-cyan-100 text-cyan-800 border-cyan-200",
  [FARM_TYPES.OTHER]: "bg-slate-100 text-slate-800 border-slate-200",
};

// 농장 유형 배열 (Select 옵션용)
export const FARM_TYPE_OPTIONS = Object.entries(FARM_TYPE_LABELS).map(
  ([value, label]) => ({
    value: value as FarmType,
    label,
    icon: FARM_TYPE_ICONS[value as FarmType],
    color: FARM_TYPE_COLORS[value as FarmType],
  })
);

// 농장 유형 라벨 가져오기 함수
export const getFarmTypeLabel = (type: string | undefined): string => {
  if (!type) return "기타";
  return FARM_TYPE_LABELS[type as FarmType] || "기타";
};

// 농장 유형 아이콘 가져오기 함수
export const getFarmTypeIcon = (type: string | undefined) => {
  if (!type) return FARM_TYPE_ICONS.other;
  return FARM_TYPE_ICONS[type as FarmType] || FARM_TYPE_ICONS.other;
};

// 농장 유형 색상 가져오기 함수
export const getFarmTypeColor = (type: string | undefined): string => {
  if (!type) return FARM_TYPE_COLORS.other;
  return FARM_TYPE_COLORS[type as FarmType] || FARM_TYPE_COLORS.other;
};

// 농장 유형 카테고리
export const FARM_TYPE_CATEGORIES = {
  LIVESTOCK: "livestock",
  CROP: "crop",
  OTHER: "other",
} as const;

// 농장 유형별 카테고리
export const FARM_TYPE_TO_CATEGORY: Record<
  FarmType,
  (typeof FARM_TYPE_CATEGORIES)[keyof typeof FARM_TYPE_CATEGORIES]
> = {
  // 축산업
  [FARM_TYPES.CATTLE]: FARM_TYPE_CATEGORIES.LIVESTOCK,
  [FARM_TYPES.DAIRY]: FARM_TYPE_CATEGORIES.LIVESTOCK,
  [FARM_TYPES.PIGS]: FARM_TYPE_CATEGORIES.LIVESTOCK,
  [FARM_TYPES.POULTRY]: FARM_TYPE_CATEGORIES.LIVESTOCK,
  [FARM_TYPES.SHEEP_GOAT]: FARM_TYPE_CATEGORIES.LIVESTOCK,

  // 경종업
  [FARM_TYPES.RICE]: FARM_TYPE_CATEGORIES.CROP,
  [FARM_TYPES.GRAIN]: FARM_TYPE_CATEGORIES.CROP,
  [FARM_TYPES.VEGETABLE]: FARM_TYPE_CATEGORIES.CROP,
  [FARM_TYPES.FRUIT]: FARM_TYPE_CATEGORIES.CROP,
  [FARM_TYPES.FLOWER]: FARM_TYPE_CATEGORIES.CROP,
  [FARM_TYPES.MUSHROOM]: FARM_TYPE_CATEGORIES.CROP,
  [FARM_TYPES.SPECIAL_CROP]: FARM_TYPE_CATEGORIES.CROP,

  // 기타
  [FARM_TYPES.MIXED]: FARM_TYPE_CATEGORIES.OTHER,
  [FARM_TYPES.GREENHOUSE]: FARM_TYPE_CATEGORIES.CROP,
  [FARM_TYPES.SEED]: FARM_TYPE_CATEGORIES.CROP,
  [FARM_TYPES.AQUACULTURE]: FARM_TYPE_CATEGORIES.OTHER,
  [FARM_TYPES.OTHER]: FARM_TYPE_CATEGORIES.OTHER,
} as const;

// 농장 유형 유효성 검사 함수
export function isValidFarmType(type: string): type is FarmType {
  return Object.values(FARM_TYPES).includes(type as FarmType);
}

/**
 * 농장 유형 정보 가져오기
 */
export const getFarmTypeInfo = (farmType: string | null) => {
  if (!farmType) return { label: "기타", Icon: HelpCircle };
  const label =
    FARM_TYPE_LABELS[farmType as keyof typeof FARM_TYPE_LABELS] || "기타";
  const Icon =
    FARM_TYPE_ICONS[farmType as keyof typeof FARM_TYPE_ICONS] || HelpCircle;
  return { label, Icon };
};
