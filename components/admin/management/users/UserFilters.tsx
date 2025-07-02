import { CommonFilters } from "../shared/CommonFilters";

export interface UserFilters {
  search: string;
  role: string;
  status: string;
}

interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
}

export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
  return (
    <CommonFilters
      searchPlaceholder="이름 또는 이메일로 검색"
      searchValue={filters.search}
      onSearchChange={(e) =>
        onFiltersChange({ ...filters, search: e.target.value })
      }
      selects={[
        {
          value: filters.role,
          onChange: (value) => onFiltersChange({ ...filters, role: value }),
          options: [
            { value: "all", label: "전체" },
            { value: "admin", label: "관리자" },
            { value: "user", label: "일반" },
          ],
          placeholder: "권한",
        },
        {
          value: filters.status,
          onChange: (value) => onFiltersChange({ ...filters, status: value }),
          options: [
            { value: "all", label: "전체" },
            { value: "active", label: "활성" },
            { value: "inactive", label: "비활성" },
          ],
          placeholder: "상태",
        },
      ]}
    />
  );
}
