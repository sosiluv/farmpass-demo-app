import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common";

interface LoadingProps {
  /** 로딩 텍스트 (기본값: "로딩중...") */
  text?: string;
  /** 로딩 컨테이너의 최소 높이 (기본값: 400px) */
  minHeight?: string | number;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 로딩 스피너 크기 (기본값: 32px) */
  spinnerSize?: number;
  /** 로딩 스피너 색상 (기본값: text-primary) */
  spinnerColor?: string;
  /** 로딩 텍스트 표시 여부 (기본값: true) */
  showText?: boolean;
}

export function Loading({
  text = "로딩중...",
  minHeight = 400,
  className,
  spinnerSize = 32,
  spinnerColor = "text-primary",
  showText = true,
}: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300",
        className
      )}
      style={{ minHeight }}
    >
      <Loader2
        className={cn("animate-spin", spinnerColor)}
        size={spinnerSize}
      />
      {showText && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

// 페이지 전환용 로딩 컴포넌트
interface PageLoadingProps {
  /** 로딩 텍스트 */
  text?: string;
  /** 서브 텍스트 */
  subText?: string;
  /** 로고 표시 여부 (기본값: true) */
  showLogo?: boolean;
  /** 배경 스타일 (기본값: "default") */
  variant?: "default" | "gradient" | "minimal";
  /** 전체 화면 여부 (기본값: true) */
  fullScreen?: boolean;
}

export function PageLoading({
  text = "페이지를 불러오는 중...",
  subText,
  showLogo = true,
  variant = "default",
  fullScreen = true,
}: PageLoadingProps) {
  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-4",
    fullScreen && "min-h-screen",
    "bg-background"
  );

  const spinnerClasses = cn(
    "animate-spin",
    variant === "gradient"
      ? "w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
      : "h-8 w-8 text-primary"
  );

  return (
    <div className={containerClasses}>
      {showLogo && <Logo size="lg" />}
      <div className={spinnerClasses} />
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700">{text}</p>
        {subText && <p className="text-sm text-gray-500 mt-1">{subText}</p>}
      </div>
    </div>
  );
}

// 스켈레톤 로딩 컴포넌트
interface SkeletonLoadingProps {
  /** 스켈레톤 개수 */
  count?: number;
  /** 스켈레톤 높이 */
  height?: number;
  /** 간격 */
  gap?: number;
  /** 추가 CSS 클래스 */
  className?: string;
}

export function SkeletonLoading({
  count = 3,
  height = 20,
  gap = 16,
  className,
}: SkeletonLoadingProps) {
  return (
    <div className={cn("space-y-4", className)} style={{ gap: `${gap}px` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}
