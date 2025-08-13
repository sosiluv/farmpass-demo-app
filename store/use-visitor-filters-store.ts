import { create } from "zustand";
import type { VisitorFilters } from "@/lib/types/visitor";
import { formatDate } from "@/lib/utils/datetime/date";

interface VisitorFiltersState {
  filters: VisitorFilters;
  setFilters: (filters: Partial<VisitorFilters>) => void;
  setDateRange: (dateRange: string) => void;
  setCustomDateRange: (startDate: Date | null, endDate: Date | null) => void;
  resetFilters: () => void;
}

const initialFilters: VisitorFilters = {
  searchTerm: "",
  farmId: undefined,
  dateRange: "all",
  dateStart: undefined,
  dateEnd: undefined,
};

export const useVisitorFiltersStore = create<VisitorFiltersState>((set) => ({
  filters: initialFilters,

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  setDateRange: (dateRange) =>
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange,
        // 빠른 필터 선택 시 커스텀 날짜 초기화
        ...(dateRange !== "custom" && {
          dateStart: undefined,
          dateEnd: undefined,
        }),
      },
    })),

  setCustomDateRange: (startDate, endDate) =>
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: "custom",
        dateStart: startDate ? formatDate(startDate) : undefined,
        dateEnd: endDate ? formatDate(endDate) : undefined,
      },
    })),

  resetFilters: () => set({ filters: initialFilters }),
}));
