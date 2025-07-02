import { FARM_TYPE_LABELS, FARM_TYPE_ICONS } from "@/lib/constants/farm-types";
import { Building2 } from "lucide-react";

/**
 * 농장 유형 정보 가져오기
 */
export const getFarmTypeInfo = (farmType: string | null) => {
  if (!farmType) return { label: "기타", Icon: Building2 };
  const label =
    FARM_TYPE_LABELS[farmType as keyof typeof FARM_TYPE_LABELS] || "기타";
  const Icon =
    FARM_TYPE_ICONS[farmType as keyof typeof FARM_TYPE_ICONS] || Building2;
  return { label, Icon };
};
