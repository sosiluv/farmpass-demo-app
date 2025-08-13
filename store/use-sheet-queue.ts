import { create } from "zustand";
import { devtools } from "zustand/middleware";

// 시스템 시트 (자동으로 표시되는 것들)
export type SystemSheetType =
  | "notification" // 알림 권한
  | "pwa-install"; // PWA 설치

export type SheetType = SystemSheetType;

// 시스템 시트인지 확인하는 함수
const isSystemSheet = (type: SheetType): boolean => {
  const systemTypes: SystemSheetType[] = ["notification", "pwa-install"];
  return systemTypes.includes(type as SystemSheetType);
};

export interface SheetItem {
  id: string;
  type: SheetType;
  priority: number; // 높을수록 우선순위 높음
  data?: any;
  timestamp: number;
  isSystemSheet: boolean; // 시스템 시트 여부
}

interface SheetQueueState {
  // 현재 표시 중인 시트
  currentSheet: SheetItem | null;

  // 대기 중인 시트 큐
  queue: SheetItem[];

  // 시트 표시 여부
  isVisible: boolean;

  // 액션들
  addSheet: (sheet: Omit<SheetItem, "id" | "timestamp">) => void;
  removeSheet: (id: string) => void;
  showNextSheet: () => void;
  hideCurrentSheet: () => void;
  clearQueue: () => void;
  getNextSheet: () => SheetItem | null;
}

export const useSheetQueue = create<SheetQueueState>()(
  devtools(
    (set, get) => ({
      currentSheet: null,
      queue: [],
      isVisible: false,

      // 시트 추가
      addSheet: (sheetData) => {
        const newSheet: SheetItem = {
          ...sheetData,
          id: `${sheetData.type}-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          isSystemSheet: isSystemSheet(sheetData.type),
        };

        set((state) => {
          // 중복 방지: 같은 타입의 시트가 이미 있는지 확인
          const hasSameTypeInCurrent =
            state.currentSheet?.type === newSheet.type;
          const hasSameTypeInQueue = state.queue.some(
            (sheet) => sheet.type === newSheet.type
          );

          if (hasSameTypeInCurrent || hasSameTypeInQueue) {
            return state; // 아무것도 변경하지 않음
          }

          // 현재 시트가 없으면 바로 표시
          if (!state.currentSheet) {
            return {
              currentSheet: newSheet,
              isVisible: true,
            };
          }

          // 우선순위가 더 높으면 현재 시트를 큐에 넣고 새 시트 표시
          if (newSheet.priority > state.currentSheet.priority) {
            const updatedQueue = [state.currentSheet, ...state.queue];
            return {
              currentSheet: newSheet,
              queue: updatedQueue,
              isVisible: true,
            };
          }

          // 우선순위가 낮으면 큐에 추가
          const updatedQueue = [...state.queue, newSheet].sort(
            (a, b) => b.priority - a.priority
          );
          return {
            queue: updatedQueue,
          };
        });
      },

      // 시트 제거
      removeSheet: (id) => {
        set((state) => {
          if (state.currentSheet?.id === id) {
            // 현재 시트를 제거하고 다음 시트 표시
            const nextSheet = state.queue[0];
            const remainingQueue = state.queue.slice(1);

            return {
              currentSheet: nextSheet || null,
              queue: remainingQueue,
              isVisible: !!nextSheet,
            };
          }

          // 큐에서 시트 제거
          const updatedQueue = state.queue.filter((sheet) => sheet.id !== id);
          return {
            queue: updatedQueue,
          };
        });
      },

      // 다음 시트 표시
      showNextSheet: () => {
        const { getNextSheet } = get();
        const nextSheet = getNextSheet();

        if (nextSheet) {
          set({
            currentSheet: nextSheet,
            isVisible: true,
          });
        }
      },

      // 현재 시트 숨기기
      hideCurrentSheet: () => {
        set({
          isVisible: false,
        });
      },

      // 큐 초기화
      clearQueue: () => {
        set({
          currentSheet: null,
          queue: [],
          isVisible: false,
        });
      },

      // 다음 시트 가져오기
      getNextSheet: () => {
        const { queue } = get();
        return queue.length > 0 ? queue[0] : null;
      },
    }),
    {
      name: "sheet-queue",
    }
  )
);
