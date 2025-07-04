"use client";

import React, { Component, ReactNode } from "react";
import { AdminError } from "./admin-error";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  title?: string;
  description?: string;
  showNavigation?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorCount: 1 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { errorCount } = this.state;
    const newErrorCount = errorCount + 1;

    devLog.error("ErrorBoundary caught an error:", error, errorInfo);

    // 에러 카운트 업데이트
    this.setState({ errorCount: newErrorCount });

    // 캐시 관련 에러인지 확인
    const isCacheError =
      error.message.includes("cache") ||
      error.message.includes("CACHE") ||
      error.stack?.includes("cache") ||
      error.stack?.includes("CACHE");

    // 캐시 관련 에러인 경우 추가 로그
    if (isCacheError) {
      devLog.warn("[CACHE] Cache-related error detected in ErrorBoundary:", {
        message: error.message,
        stack: error.stack,
        errorCount: newErrorCount,
      });
    }

    // 에러가 너무 많이 발생하면 개발자에게 알림
    if (newErrorCount >= 5) {
      devLog.error("[ERROR_BOUNDARY] Too many errors detected:", {
        errorCount: newErrorCount,
        lastError: error.message,
      });
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorCount: 0 });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      // 기본 AdminError 컴포넌트 사용
      return (
        <AdminError
          error={this.state.error}
          reset={this.reset}
          title={this.props.title}
          description={this.props.description}
          showNavigation={this.props.showNavigation}
        />
      );
    }

    return this.props.children;
  }
}

// Hook 버전의 Error Boundary (React 18+)
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}
