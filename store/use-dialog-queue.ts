import { create } from "zustand";
import { devtools } from "zustand/middleware";

// 시스템 다이얼로그 (자동으로 표시되는 것들)
export type SystemDialogType =
  | "notification" // 알림 권한
  | "pwa-install" // PWA 설치
  | "maintenance" // 유지보수
  | "update"; // 업데이트

// 사용자 다이얼로그 (사용자가 직접 열는 것들)
export type UserDialogType =
  | "farm-create" // 농장 등록
  | "farm-edit" // 농장 수정
  | "member-add" // 멤버 추가
  | "visitor-export" // 방문자 내보내기
  | "settings" // 설정
  | "profile-edit"; // 프로필 수정

export type DialogType = SystemDialogType | UserDialogType;

// 시스템 다이얼로그인지 확인하는 함수
const isSystemDialog = (type: DialogType): boolean => {
  const systemTypes: SystemDialogType[] = [
    "notification",
    "pwa-install",
    "maintenance",
    "update",
  ];
  return systemTypes.includes(type as SystemDialogType);
};

export interface DialogItem {
  id: string;
  type: DialogType;
  priority: number; // 높을수록 우선순위 높음
  data?: any;
  timestamp: number;
  isSystemDialog: boolean; // 시스템 다이얼로그 여부
}

interface DialogQueueState {
  // 현재 표시 중인 다이얼로그
  currentDialog: DialogItem | null;

  // 대기 중인 다이얼로그 큐
  queue: DialogItem[];

  // 다이얼로그 표시 여부
  isVisible: boolean;

  // 액션들
  addDialog: (dialog: Omit<DialogItem, "id" | "timestamp">) => void;
  removeDialog: (id: string) => void;
  showNextDialog: () => void;
  hideCurrentDialog: () => void;
  clearQueue: () => void;
  getNextDialog: () => DialogItem | null;
}

export const useDialogQueue = create<DialogQueueState>()(
  devtools(
    (set, get) => ({
      currentDialog: null,
      queue: [],
      isVisible: false,

      // 다이얼로그 추가
      addDialog: (dialogData) => {
        const newDialog: DialogItem = {
          ...dialogData,
          id: `${dialogData.type}-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          isSystemDialog: isSystemDialog(dialogData.type),
        };

        set((state) => {
          // 현재 다이얼로그가 없으면 바로 표시
          if (!state.currentDialog) {
            return {
              currentDialog: newDialog,
              isVisible: true,
            };
          }

          // 사용자 다이얼로그는 시스템 다이얼로그보다 항상 우선
          if (!newDialog.isSystemDialog && state.currentDialog.isSystemDialog) {
            const updatedQueue = [state.currentDialog, ...state.queue];
            return {
              currentDialog: newDialog,
              queue: updatedQueue,
              isVisible: true,
            };
          }

          // 우선순위가 더 높으면 현재 다이얼로그를 큐에 넣고 새 다이얼로그 표시
          if (newDialog.priority > state.currentDialog.priority) {
            const updatedQueue = [state.currentDialog, ...state.queue];
            return {
              currentDialog: newDialog,
              queue: updatedQueue,
              isVisible: true,
            };
          }

          // 우선순위가 낮으면 큐에 추가
          const updatedQueue = [...state.queue, newDialog].sort(
            (a, b) => b.priority - a.priority
          );
          return {
            queue: updatedQueue,
          };
        });
      },

      // 다이얼로그 제거
      removeDialog: (id) => {
        set((state) => {
          if (state.currentDialog?.id === id) {
            // 현재 다이얼로그를 제거하고 다음 다이얼로그 표시
            const nextDialog = state.queue[0];
            const remainingQueue = state.queue.slice(1);

            return {
              currentDialog: nextDialog || null,
              queue: remainingQueue,
              isVisible: !!nextDialog,
            };
          }

          // 큐에서 다이얼로그 제거
          const updatedQueue = state.queue.filter((dialog) => dialog.id !== id);
          return {
            queue: updatedQueue,
          };
        });
      },

      // 다음 다이얼로그 표시
      showNextDialog: () => {
        const { getNextDialog } = get();
        const nextDialog = getNextDialog();

        if (nextDialog) {
          set({
            currentDialog: nextDialog,
            isVisible: true,
          });
        }
      },

      // 현재 다이얼로그 숨기기
      hideCurrentDialog: () => {
        set({
          isVisible: false,
        });
      },

      // 큐 초기화
      clearQueue: () => {
        set({
          currentDialog: null,
          queue: [],
          isVisible: false,
        });
      },

      // 다음 다이얼로그 가져오기
      getNextDialog: () => {
        const { queue } = get();
        return queue.length > 0 ? queue[0] : null;
      },
    }),
    {
      name: "dialog-queue",
    }
  )
);
