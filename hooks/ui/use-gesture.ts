import React from "react";
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

export interface DragToResizeOptions {
  /** 초기 높이 (vh 단위) */
  initialHeight?: number;
  /** 최소 높이 (vh 단위) */
  minHeight?: number;
  /** 최대 높이 (vh 단위) */
  maxHeight?: number;
  /** 크기 변경 콜백 함수 */
  onResize?: (height: number) => void;
  /** 닫기 콜백 함수 */
  onClose?: () => void;
  /** 닫기 임계값 (vh 단위) */
  closeThreshold?: number;
  /** 활성화 여부 */
  enabled?: boolean;
  /** 모달 열림 상태 (높이 초기화 트리거용) */
  open?: boolean;
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
 * 드래그로 크기 조정 제스처 훅
 * bottom sheet의 크기를 드래그로 조정할 때 사용
 *
 * @example
 * const { bind, height } = useDragToResize({
 *   initialHeight: 50,
 *   minHeight: 30,
 *   maxHeight: 90,
 *   onResize: (newHeight) => console.log(newHeight)
 * });
 * return <div {...bind()} style={{ height: `${height}vh` }}>크기 조정 가능한 시트</div>
 */
export function useDragToResize({
  initialHeight = 75,
  minHeight = 30,
  maxHeight = 95,
  onResize,
  onClose,
  closeThreshold = 30,
  enabled = true,
  open,
}: DragToResizeOptions) {
  const [height, setHeight] = React.useState(initialHeight);
  const [isDragging, setIsDragging] = React.useState(false);
  const initialHeightRef = React.useRef(initialHeight);

  // initialHeight가 변경되면 업데이트
  React.useEffect(() => {
    if (initialHeight !== initialHeightRef.current) {
      setHeight(initialHeight);
      initialHeightRef.current = initialHeight;
    }
  }, [initialHeight]);

  // 모달이 열릴 때마다 높이를 초기값으로 리셋
  React.useEffect(() => {
    if (open === true) {
      setHeight(initialHeight);
      setIsDragging(false);
    }
  }, [open, initialHeight]);

  const bind = useDrag(
    ({ movement, active, last, event, memo }) => {
      if (!enabled) return;

      // 이벤트 전파 방지
      if (event) {
        event.stopPropagation();
      }

      const [, my] = movement;
      const viewportHeight = window.innerHeight;

      if (active && !isDragging) {
        setIsDragging(true);
      }

      if (!active && isDragging) {
        setIsDragging(false);
      }

      // 드래그 시작 시 현재 높이를 memo로 저장
      const startHeight = memo || height;

      // 드래그 거리를 vh 단위로 변환 (아래로 드래그하면 양수, 위로 드래그하면 음수)
      const deltaVh = (my / viewportHeight) * 100;
      let newHeight = startHeight - deltaVh; // 위로 드래그하면 높이 증가, 아래로 드래그하면 높이 감소

      // 실시간으로 높이 업데이트 (범위 제한 없이)
      if (active) {
        // 드래그 중에는 범위를 넘어서도 시각적 피드백 제공
        const visualHeight = Math.max(0, Math.min(100, newHeight));
        setHeight(visualHeight);

        if (onResize) {
          onResize(visualHeight);
        }
      }

      // 드래그 완료 시 처리
      if (last) {
        // 닫기 임계값 체크
        if (newHeight < closeThreshold && onClose) {
          onClose();
          return startHeight; // 닫힐 때는 원래 높이 반환
        }

        // 정상 범위로 제한
        const finalHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        setHeight(finalHeight);

        if (onResize) {
          onResize(finalHeight);
        }

        return finalHeight;
      }

      return startHeight;
    },
    {
      enabled,
      axis: "y",
      filterTaps: true,
      from: () => [0, 0],
    }
  );

  return { bind, height, setHeight, isDragging };
}
