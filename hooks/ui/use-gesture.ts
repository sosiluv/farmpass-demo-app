import { useDrag } from "@use-gesture/react";

/**
 * 공통 제스처 훅들
 * @use-gesture/react를 기반으로 한 재사용 가능한 제스처 훅들
 */

export interface SwipeToCloseOptions {
  /** 스와이프 방향 */
  direction: "left" | "right" | "up" | "down";
  /** 스와이프 임계값 (px) */
  threshold?: number;
  /** 닫기 콜백 함수 */
  onClose: () => void;
  /** 활성화 여부 */
  enabled?: boolean;
}

export interface DragToCloseOptions {
  /** 드래그 방향 */
  direction: "horizontal" | "vertical";
  /** 드래그 임계값 (px) */
  threshold?: number;
  /** 닫기 콜백 함수 */
  onClose: () => void;
  /** 활성화 여부 */
  enabled?: boolean;
  /** 이벤트 전파 방지 */
  preventPropagation?: boolean;
}

export interface SwipeToOpenOptions {
  /** 스와이프 방향 */
  direction: "left" | "right" | "up" | "down";
  /** 스와이프 임계값 (px) */
  threshold?: number;
  /** 열기 콜백 함수 */
  onOpen: () => void;
  /** 활성화 여부 */
  enabled?: boolean;
}

export interface EdgeSwipeOptions {
  /** 가장자리 영역 크기 (px) */
  edgeSize?: number;
  /** 스와이프 방향 */
  direction: "right" | "left" | "down" | "up";
  /** 스와이프 임계값 (px) */
  threshold?: number;
  /** 열기 콜백 함수 */
  onOpen: () => void;
  /** 활성화 여부 */
  enabled?: boolean;
}

/**
 * 스와이프로 닫기 제스처 훅
 * 사이드바, 드로어 등에서 사용
 *
 * @example
 * const bind = useSwipeToClose({
 *   direction: "left",
 *   onClose: () => setSidebarOpen(false)
 * });
 * return <div {...bind()}>사이드바</div>
 */
export function useSwipeToClose({
  direction,
  threshold = 50,
  onClose,
  enabled = true,
}: SwipeToCloseOptions) {
  const bind = useDrag(
    ({ movement, last, cancel }) => {
      if (!enabled) return;

      const [mx, my] = movement;
      let shouldClose = false;

      // 방향에 따른 닫기 조건 확인
      switch (direction) {
        case "left":
          shouldClose = mx < -threshold;
          break;
        case "right":
          shouldClose = mx > threshold;
          break;
        case "up":
          shouldClose = my < -threshold;
          break;
        case "down":
          shouldClose = my > threshold;
          break;
      }

      if (shouldClose && last) {
        onClose();
        cancel && cancel();
      }
    },
    {
      enabled,
      axis: direction === "left" || direction === "right" ? "x" : "y",
      filterTaps: true,
    }
  );

  return bind;
}

/**
 * 드래그로 닫기 제스처 훅
 * 모달, 시트 등에서 사용
 *
 * @example
 * const bind = useDragToClose({
 *   direction: "vertical",
 *   onClose: () => setModalOpen(false)
 * });
 * return <div {...bind()}>모달 내용</div>
 */
export function useDragToClose({
  direction,
  threshold = 50,
  onClose,
  enabled = true,
  preventPropagation = false,
}: DragToCloseOptions) {
  const bind = useDrag(
    ({ movement, last, cancel, event }) => {
      if (!enabled) return;

      // 이벤트 전파 방지
      if (preventPropagation && event) {
        event.stopPropagation();
      }

      const [mx, my] = movement;
      let shouldClose = false;

      // 방향에 따른 닫기 조건 확인
      if (direction === "horizontal") {
        // 좌우 어느 방향이든 threshold 이상이면 닫기
        shouldClose = Math.abs(mx) > threshold;
      } else {
        // 세로 방향은 아래로만 (양수)
        shouldClose = my > threshold;
      }

      if (shouldClose && last) {
        onClose();
        cancel && cancel();
      }
    },
    {
      enabled,
      axis: direction === "horizontal" ? "x" : "y",
      filterTaps: true,
    }
  );

  return bind;
}

/**
 * 스와이프로 열기 제스처 훅
 * 일반적인 스와이프로 열기 (어디서든)
 *
 * @example
 * const bind = useSwipeToOpen({
 *   direction: "right",
 *   onOpen: () => setSidebarOpen(true)
 * });
 * return <div {...bind()}>스와이프 영역</div>
 */
export function useSwipeToOpen({
  direction,
  threshold = 50,
  onOpen,
  enabled = true,
}: SwipeToOpenOptions) {
  const bind = useDrag(
    ({ movement, last, cancel }) => {
      if (!enabled) return;

      const [mx, my] = movement;
      let shouldOpen = false;

      // 방향에 따른 열기 조건 확인
      switch (direction) {
        case "left":
          shouldOpen = mx < -threshold;
          break;
        case "right":
          shouldOpen = mx > threshold;
          break;
        case "up":
          shouldOpen = my < -threshold;
          break;
        case "down":
          shouldOpen = my > threshold;
          break;
      }

      if (shouldOpen && last) {
        onOpen();
        cancel && cancel();
      }
    },
    {
      enabled,
      axis: direction === "left" || direction === "right" ? "x" : "y",
      filterTaps: true,
    }
  );

  return bind;
}

export function useEdgeSwipe({
  edgeSize = 20,
  direction,
  threshold = 50,
  onOpen,
  enabled = true,
}: EdgeSwipeOptions) {
  const bind = useDrag(
    ({ movement, last, cancel, initial }) => {
      if (!enabled) return;

      const [mx, my] = movement;
      const [initialX, initialY] = initial;
      let shouldOpen = false;
      let validEdgeStart = false;

      // 가장자리에서 시작했는지 확인
      switch (direction) {
        case "right":
          validEdgeStart = initialX <= edgeSize;
          shouldOpen = mx > threshold;
          break;
        case "left":
          validEdgeStart = initialX >= window.innerWidth - edgeSize;
          shouldOpen = mx < -threshold;
          break;
        case "down":
          validEdgeStart = initialY <= edgeSize;
          shouldOpen = my > threshold;
          break;
        case "up":
          validEdgeStart = initialY >= window.innerHeight - edgeSize;
          shouldOpen = my < -threshold;
          break;
      }

      if (validEdgeStart && shouldOpen && last) {
        onOpen();
        cancel && cancel();
      }
    },
    {
      enabled,
      axis: direction === "left" || direction === "right" ? "x" : "y",
      filterTaps: true,
    }
  );

  return bind;
}

/**
 * 범용 제스처 훅 (커스텀 로직용)
 *
 * @example
 * const bind = useCustomGesture({
 *   onDrag: ({ movement: [mx, my] }) => {
 *     // 커스텀 드래그 로직
 *   },
 *   onPinch: ({ offset: [scale] }) => {
 *     // 커스텀 핀치 로직
 *   }
 * });
 */
export function useCustomGesture(handlers: any, options?: any) {
  return useDrag(handlers, options);
}
