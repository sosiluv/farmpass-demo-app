import { CommonFilters } from "../shared/CommonFilters";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/management";

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
      searchPlaceholder={PLACEHOLDERS.USER_SEARCH_PLACEHOLDER}
      searchValue={filters.search}
      onSearchChange={(e) =>
        onFiltersChange({ ...filters, search: e.target.value })
      }
      selects={[
        {
          value: filters.role,
          onChange: (value) => onFiltersChange({ ...filters, role: value }),
          options: [
            { value: "all", label: LABELS.ALL_USERS },
            { value: "admin", label: LABELS.ADMIN },
            { value: "user", label: LABELS.GENERAL_USER },
          ],
          placeholder: PLACEHOLDERS.ROLE_PLACEHOLDER,
        },
        {
          value: filters.status,
          onChange: (value) => onFiltersChange({ ...filters, status: value }),
          options: [
            { value: "all", label: LABELS.ALL_USERS },
            { value: "active", label: LABELS.ACTIVE },
            { value: "inactive", label: LABELS.INACTIVE },
          ],
          placeholder: PLACEHOLDERS.USER_STATUS_PLACEHOLDER,
        },
      ]}
    />
  );
}
