import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { supabase } from "@/lib/supabase/client";
import { handleError } from "@/lib/utils/error";
import { apiClient } from "@/lib/utils/data";
import {
  formatLocalDate,
  getTodayRange,
  createKSTDateRange,
} from "@/lib/utils/datetime/date";
import { useMemo } from "react";
import { calculateVisitorStats } from "@/lib/utils/data/common-stats";
import type {
  VisitorWithFarm,
  CreateVisitorData,
  UpdateVisitorData,
} from "@/lib/types/visitor";

// 통합된 방문자 타입 (기존 VisitorEntryWithFarm 호환)
export type Visitor = VisitorWithFarm;

// 필터 옵션
export interface VisitorFilters {
  searchTerm: string;
  farmId?: string;
  dateRange: string; // "all" | "today" | "week" | "month" | "custom"
  dateStart?: string;
  dateEnd?: string;
  disinfectionCheck?: boolean;
  consentGiven?: boolean;
}

// 로딩 상태
interface LoadingState {
  visitors: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

// 에러 상태
interface ErrorState {
  visitors: string | null;
  create: string | null;
  update: string | null;
  delete: string | null;
}

// 캐시 관리
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface Cache {
  visitors: CacheEntry<any[]> | null;
  lastFetchTime: number;
  isFetching: boolean;
}

const CACHE_TTL = 30000; // 30초 캐시
const DEBOUNCE_DELAY = 1000; // 1초 디바운스

// Store 인터페이스
interface VisitorState {
  // 데이터
  visitors: Visitor[];
  filteredVisitors: Visitor[];

  // 상태
  loading: LoadingState;
  error: ErrorState;
  filters: VisitorFilters;

  // 액션
  fetchVisitors: (options?: {
    farmId?: string;
    includeAllFarms?: boolean;
  }) => Promise<void>;
  createVisitor: (data: CreateVisitorData) => Promise<Visitor>;
  updateVisitor: (
    id: string,
    farmId: string,
    data: UpdateVisitorData
  ) => Promise<Visitor>;
  deleteVisitor: (id: string, farmId: string) => Promise<void>;

  // 필터링
  setFilters: (filters: Partial<VisitorFilters>) => void;
  setDateRange: (dateRange: string) => void;
  setCustomDateRange: (startDate: Date | null, endDate: Date | null) => void;
  resetFilters: () => void;
  applyFilters: () => void;

  // 유틸리티
  getVisitorById: (id: string) => Visitor | undefined;
  getVisitorsByFarm: (farmId: string) => Visitor[];
  getTodayVisitors: () => Visitor[];
  getVisitorStats: () => {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };

  // 리셋
  reset: () => void;

  // 캐시
  cache: Cache;

  // 캐시 무효화
  invalidateCache: () => void;
}

const initialLoadingState: LoadingState = {
  visitors: false,
  create: false,
  update: false,
  delete: false,
};

const initialErrorState: ErrorState = {
  visitors: null,
  create: null,
  update: null,
  delete: null,
};

const initialFilters: VisitorFilters = {
  searchTerm: "",
  dateRange: "all",
};

export const useVisitorStore = create<VisitorState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      visitors: [],
      filteredVisitors: [],
      loading: initialLoadingState,
      error: initialErrorState,
      filters: initialFilters,
      cache: {
        visitors: null,
        lastFetchTime: 0,
        isFetching: false,
      } as Cache,

      // 방문자 목록 조회 (캐싱 및 중복 요청 방지)
      fetchVisitors: async (options = {}) => {
        const { farmId, includeAllFarms = false } = options;
        const state = get();
        const now = Date.now();

        // 캐시 확인
        if (
          state.cache.visitors &&
          now - state.cache.visitors.timestamp < CACHE_TTL &&
          !state.cache.isFetching
        ) {
          set((state) => ({
            visitors: state.cache.visitors!.data,
            loading: { ...state.loading, visitors: false },
          }));
          get().applyFilters();
          return;
        }

        // 중복 요청 방지
        if (state.cache.isFetching) {
          return;
        }

        // 디바운싱
        if (now - state.cache.lastFetchTime < DEBOUNCE_DELAY) {
          return;
        }

        set((state) => ({
          loading: { ...state.loading, visitors: true },
          error: { ...state.error, visitors: null },
          cache: { ...state.cache, isFetching: true, lastFetchTime: now },
        }));

        try {
          let query = supabase.from("visitor_entries").select(`
            *,
            farms (
              farm_name,
              farm_type
            ),
            registered_by_profile:profiles!visitor_entries_registered_by_fkey(id, email, name, profile_image_url)
          `);

          if (farmId) {
            query = query.eq("farm_id", farmId);
          }

          const { data, error } = await query.order("visit_datetime", {
            ascending: false,
          });

          if (error) throw error;

          const visitorData = data || [];

          // 캐시 업데이트
          set((state) => ({
            visitors: visitorData,
            loading: { ...state.loading, visitors: false },
            cache: {
              ...state.cache,
              visitors: {
                data: visitorData,
                timestamp: now,
                ttl: CACHE_TTL,
              },
              isFetching: false,
            },
          }));

          // 필터 적용
          get().applyFilters();
        } catch (error) {
          handleError(error, {
            context: "방문자 데이터 조회",
            onStateUpdate: (errorMessage) => {
              set((state) => ({
                loading: { ...state.loading, visitors: false },
                error: { ...state.error, visitors: errorMessage },
                cache: { ...state.cache, isFetching: false },
              }));
            },
          });
          throw error;
        }
      },

      // 방문자 생성
      createVisitor: async (data: CreateVisitorData) => {
        set((state) => ({
          loading: { ...state.loading, create: true },
          error: { ...state.error, create: null },
        }));

        try {
          const visitor = await apiClient(
            `/api/farms/${data.farm_id}/visitors`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
              context: "방문자 등록",
              onError: (error, context) => {
                handleError(error, {
                  context,
                  onStateUpdate: (errorMessage) => {
                    set((state) => ({
                      loading: { ...state.loading, create: false },
                      error: { ...state.error, create: errorMessage },
                    }));
                  },
                });
                // 토스트는 컴포넌트에서 처리
              },
            }
          );

          set((state) => ({
            visitors: [visitor, ...state.visitors],
            loading: { ...state.loading, create: false },
          }));

          // 캐시 무효화
          get().invalidateCache();

          // 필터 재적용
          get().applyFilters();

          return visitor;
        } catch (error) {
          // 에러는 이미 onError에서 처리됨
          throw error;
        }
      },

      // 방문자 수정
      updateVisitor: async (
        id: string,
        farmId: string,
        data: UpdateVisitorData
      ) => {
        set((state) => ({
          loading: { ...state.loading, update: true },
          error: { ...state.error, update: null },
        }));

        try {
          const visitor = await apiClient(
            `/api/farms/${farmId}/visitors/${id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
              context: "방문자 수정",
              onError: (error, context) => {
                handleError(error, {
                  context,
                  onStateUpdate: (errorMessage) => {
                    set((state) => ({
                      loading: { ...state.loading, update: false },
                      error: { ...state.error, update: errorMessage },
                    }));
                  },
                });
              },
            }
          );

          set((state) => ({
            visitors: state.visitors.map((v) =>
              v.id === id ? { ...v, ...visitor } : v
            ),
            loading: { ...state.loading, update: false },
          }));

          // 캐시 무효화
          get().invalidateCache();

          // 필터 재적용
          get().applyFilters();

          return visitor;
        } catch (error) {
          // 에러는 이미 onError에서 처리됨
          throw error;
        }
      },

      // 방문자 삭제
      deleteVisitor: async (id: string, farmId: string) => {
        set((state) => ({
          loading: { ...state.loading, delete: true },
          error: { ...state.error, delete: null },
        }));

        try {
          await apiClient(`/api/farms/${farmId}/visitors/${id}`, {
            method: "DELETE",
            context: "방문자 삭제",
            onError: (error, context) => {
              handleError(error, {
                context,
                onStateUpdate: (errorMessage) => {
                  set((state) => ({
                    loading: { ...state.loading, delete: false },
                    error: { ...state.error, delete: errorMessage },
                  }));
                },
              });
            },
          });

          set((state) => ({
            visitors: state.visitors.filter((v) => v.id !== id),
            loading: { ...state.loading, delete: false },
          }));

          // 캐시 무효화
          get().invalidateCache();

          // 필터 재적용
          get().applyFilters();
        } catch (error) {
          // 에러는 이미 onError에서 처리됨
          throw error;
        }
      },

      // 필터 설정
      setFilters: (newFilters: Partial<VisitorFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
        get().applyFilters();
      },

      // 날짜 범위 설정
      setDateRange: (dateRange: string) => {
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
        }));
        get().applyFilters();
      },

      // 커스텀 날짜 범위 설정
      setCustomDateRange: (startDate: Date | null, endDate: Date | null) => {
        set((state) => ({
          filters: {
            ...state.filters,
            dateRange: "custom",
            dateStart: startDate ? formatLocalDate(startDate) : undefined,
            dateEnd: endDate ? formatLocalDate(endDate) : undefined,
          },
        }));
        get().applyFilters();
      },

      // 필터 리셋
      resetFilters: () => {
        set({ filters: initialFilters });
        get().applyFilters();
      },

      // 필터 적용
      applyFilters: () => {
        const { visitors, filters } = get();
        let filtered = [...visitors];

        // 검색어 필터
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filtered = filtered.filter(
            (visitor) =>
              visitor.visitor_name.toLowerCase().includes(searchLower) ||
              visitor.visitor_phone.includes(searchLower) ||
              visitor.visitor_address.toLowerCase().includes(searchLower) ||
              visitor.farms?.farm_name.toLowerCase().includes(searchLower)
          );
        }

        // 농장 필터
        if (filters.farmId) {
          filtered = filtered.filter(
            (visitor) => visitor.farm_id === filters.farmId
          );
        }

        // 날짜 범위 필터 처리
        if (filters.dateRange !== "all") {
          const now = new Date();
          let startDate: Date | null = null;
          let endDate: Date | null = null;

          switch (filters.dateRange) {
            case "today":
              startDate = new Date(now);
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date(now);
              endDate.setHours(23, 59, 59, 999);
              break;
            case "week":
              startDate = new Date(now);
              startDate.setDate(startDate.getDate() - 7);
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date(now);
              endDate.setHours(23, 59, 59, 999);
              break;
            case "month":
              startDate = new Date(now);
              startDate.setDate(startDate.getDate() - 30);
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date(now);
              endDate.setHours(23, 59, 59, 999);
              break;
            case "custom":
              // 커스텀 날짜 범위는 dateStart/dateEnd 사용
              if (filters.dateStart) {
                startDate = createKSTDateRange(filters.dateStart, false);
              }
              if (filters.dateEnd) {
                endDate = createKSTDateRange(filters.dateEnd, true);
              }
              break;
          }

          if (startDate) {
            filtered = filtered.filter(
              (visitor) => new Date(visitor.visit_datetime) >= startDate!
            );
          }

          if (endDate) {
            filtered = filtered.filter(
              (visitor) => new Date(visitor.visit_datetime) <= endDate!
            );
          }
        }

        // 방역 확인 필터
        if (filters.disinfectionCheck !== undefined) {
          filtered = filtered.filter(
            (visitor) =>
              visitor.disinfection_check === filters.disinfectionCheck
          );
        }

        // 동의 필터
        if (filters.consentGiven !== undefined) {
          filtered = filtered.filter(
            (visitor) => visitor.consent_given === filters.consentGiven
          );
        }

        set({ filteredVisitors: filtered });
      },

      // 유틸리티 함수들
      getVisitorById: (id: string) => {
        return get().visitors.find((visitor) => visitor.id === id);
      },

      getVisitorsByFarm: (farmId: string) => {
        return get().visitors.filter((visitor) => visitor.farm_id === farmId);
      },

      getTodayVisitors: () => {
        const { start: todayStart, end: todayEnd } = getTodayRange();

        return get().visitors.filter((visitor) => {
          const visitDate = new Date(visitor.visit_datetime);
          return visitDate >= todayStart && visitDate <= todayEnd;
        });
      },

      getVisitorStats: () => {
        const { visitors } = get();
        const stats = calculateVisitorStats({ visitors });

        return {
          total: stats.total,
          today: stats.today,
          thisWeek: stats.thisWeek,
          thisMonth: stats.thisMonth,
        };
      },

      // 전체 리셋
      reset: () => {
        set({
          visitors: [],
          filteredVisitors: [],
          loading: initialLoadingState,
          error: initialErrorState,
          filters: initialFilters,
          cache: {
            visitors: null,
            lastFetchTime: 0,
            isFetching: false,
          } as Cache,
        });
      },

      // 캐시 무효화
      invalidateCache: () => {
        set((state) => ({
          cache: {
            ...state.cache,
            visitors: null,
            lastFetchTime: 0,
          },
        }));
      },
    }),
    { name: "visitor-store" }
  )
);

// 간편한 훅들
export const useVisitors = () => {
  const store = useVisitorStore();

  // stats를 메모이제이션하여 불필요한 재계산 방지
  const stats = useMemo(
    () => store.getVisitorStats(),
    [store.visitors.length, store.visitors]
  );

  return {
    visitors: store.filteredVisitors,
    allVisitors: store.visitors,
    loading: store.loading.visitors,
    error: store.error.visitors,
    stats,
    fetchVisitors: store.fetchVisitors,
    createVisitor: store.createVisitor,
    updateVisitor: store.updateVisitor,
    deleteVisitor: store.deleteVisitor,
  };
};

export const useVisitorFiltersStore = () => {
  const store = useVisitorStore();
  return {
    filters: store.filters,
    setFilters: store.setFilters,
    setDateRange: store.setDateRange,
    setCustomDateRange: store.setCustomDateRange,
    resetFilters: store.resetFilters,
    applyFilters: store.applyFilters,
  };
};

// 기존 타입과의 호환성을 위한 별칭들
export type VisitorEntryWithFarm = Visitor;
