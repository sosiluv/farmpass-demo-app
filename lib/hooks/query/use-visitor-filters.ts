import { create } from "zustand";
import type { VisitorFilters } from "@/lib/types/visitor";
import { formatLocalDate } from "@/lib/utils/datetime/date";

interface VisitorFiltersState {
  filters: VisitorFilters;
  setFilters: (filters: Partial<VisitorFilters>) => void;
  setDateRange: (dateRange: string) => void;
  setCustomDateRange: (startDate: Date | null, endDate: Date | null) => void;
  resetFilters: () => void;
}

const initialFilters: VisitorFilters = {
  searchTerm: "",
  dateRange: "all",
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
        dateStart: startDate ? formatLocalDate(startDate) : undefined,
        dateEnd: endDate ? formatLocalDate(endDate) : undefined,
      },
    })),
    
  resetFilters: () =>
    set({ filters: initialFilters }),
}));
