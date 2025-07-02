import { CommonFilters } from "../shared/CommonFilters";
import {
  FARM_TYPES,
  FARM_TYPE_LABELS,
  type FarmType,
  FARM_TYPE_TO_CATEGORY,
} from "@/lib/constants/farm-types";

export interface FarmFilters {
  search: string;
  type: "all" | FarmType;
  status: "all" | "active" | "inactive";
  region: string;
}

interface FarmFiltersProps {
  filters: FarmFilters;
  onFiltersChange: (filters: FarmFilters) => void;
}

export function FarmFilters({ filters, onFiltersChange }: FarmFiltersProps) {
  // 카테고리별로 농장 유형 그룹화
  const farmTypesByCategory = Object.entries(FARM_TYPES).reduce<
    Record<string, { value: FarmType; label: string }[]>
  >((acc, [_, type]) => {
    const category = FARM_TYPE_TO_CATEGORY[type as FarmType];
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({
      value: type as FarmType,
      label: FARM_TYPE_LABELS[type as FarmType],
    });
    return acc;
  }, {});

  const farmTypeOptions = Object.values(FARM_TYPE_LABELS).map((label) => ({
    value: label,
    label,
  }));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleTypeChange = (value: string) => {
    onFiltersChange({ ...filters, type: value as FarmType | "all" });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value as "all" | "active" | "inactive",
    });
  };

  const extraButtons = <>{/* Add any extra buttons here */}</>;

  return (
    <CommonFilters
      searchPlaceholder="농장명 또는 주소 검색..."
      searchValue={filters.search || ""}
      onSearchChange={handleSearchChange}
      selects={[
        {
          value: filters.type || "all",
          onChange: handleTypeChange,
          options: [{ value: "all", label: "모든 유형" }, ...farmTypeOptions],
          placeholder: "농장 유형",
        },
        {
          value: filters.status || "all",
          onChange: handleStatusChange,
          options: [
            { value: "all", label: "모든 상태" },
            { value: "active", label: "활성" },
            { value: "inactive", label: "비활성" },
            { value: "suspended", label: "정지" },
          ],
          placeholder: "상태",
        },
      ]}
      extra={extraButtons}
    />
  );
}
