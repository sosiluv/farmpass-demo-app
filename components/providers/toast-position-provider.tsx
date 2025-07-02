"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface ToastPositionContextType {
  position: ToastPosition;
  setPosition: (position: ToastPosition) => void;
  getPositionClasses: (position: ToastPosition) => string;
}

const ToastPositionContext = createContext<
  ToastPositionContextType | undefined
>(undefined);

export function useToastPosition() {
  const context = useContext(ToastPositionContext);
  if (!context) {
    throw new Error(
      "useToastPosition must be used within a ToastPositionProvider"
    );
  }
  return context;
}

interface ToastPositionProviderProps {
  children: React.ReactNode;
}

export function ToastPositionProvider({
  children,
}: ToastPositionProviderProps) {
  const [position, setPositionState] = useState<ToastPosition>("top-center");
  const [isClient, setIsClient] = useState(false);

  // 위치별 CSS 클래스 매핑
  const getPositionClasses = (pos: ToastPosition): string => {
    const baseClasses =
      "fixed z-[100] flex max-h-screen w-full p-4 md:max-w-[420px]";

    switch (pos) {
      case "top-left":
        return `${baseClasses} top-4 left-4 flex-col`;
      case "top-center":
        return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2 flex-col items-center`;
      case "top-right":
        return `${baseClasses} top-4 right-4 flex-col`;
      case "bottom-left":
        return `${baseClasses} bottom-4 left-4 flex-col`;
      case "bottom-center":
        return `${baseClasses} bottom-4 left-1/2 transform -translate-x-1/2 flex-col items-center`;
      case "bottom-right":
      default:
        return `${baseClasses} bottom-4 right-4 flex-col`;
    }
  };

  // 위치 변경 함수
  const setPosition = (newPosition: ToastPosition) => {
    setPositionState(newPosition);
    if (typeof window !== "undefined") {
      localStorage.setItem("toast-position", newPosition);
    }
  };

  // 초기 위치 로드 - SSR 안전
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const savedPosition = localStorage.getItem(
        "toast-position"
      ) as ToastPosition;
      if (
        savedPosition &&
        [
          "top-left",
          "top-center",
          "top-right",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ].includes(savedPosition)
      ) {
        setPositionState(savedPosition);
      }
    }
  }, []);

  return (
    <ToastPositionContext.Provider
      value={{
        position,
        setPosition,
        getPositionClasses,
      }}
    >
      {children}
    </ToastPositionContext.Provider>
  );
}
