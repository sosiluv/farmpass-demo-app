"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { cn } from "@/lib/utils";

interface LottieLoadingProps {
  text?: string;
  subText?: string;
  fullScreen?: boolean;
  animationPath?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export function LottieLoading({
  text = "페이지를 불러오는 중...",
  subText,
  fullScreen = false,
  animationPath = "/lottie/plant_loading.json",
  size = "lg",
  showText = true,
}: LottieLoadingProps) {
  const [animationData, setAnimationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dots, setDots] = useState("");

  // 애니메이션 파일 로드
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch(animationPath);
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.status}`);
        }
        const data = await response.json();
        setAnimationData(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load Lottie animation:", err);
        setError(true);
        setLoading(false);
      }
    };

    loadAnimation();
  }, [animationPath]);

  // 텍스트 점 애니메이션
  useEffect(() => {
    if (!showText) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, [showText]);

  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-6",
    fullScreen ? "min-h-screen" : "flex-1",
    "bg-gradient-to-br from-background to-secondary/20"
  );

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-48 h-48",
    xl: "w-64 h-64",
  };

  // 로딩 중이거나 에러 시 폴백 UI
  if (loading || error || !animationData) {
    return (
      <div className={containerClasses}>
        <div
          className={cn("flex items-center justify-center", sizeClasses[size])}
        >
          {error ? (
            // 에러 시 심플한 스피너
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            // 로딩 중 스켈레톤
            <div
              className={cn(
                "bg-secondary/50 rounded-lg animate-pulse",
                sizeClasses[size]
              )}
            />
          )}
        </div>

        {showText && (
          <div className="text-center">
            <p className="text-lg font-medium text-foreground/80">
              {loading ? "애니메이션을 불러오는 중..." : text}
              {dots}
            </p>
            {subText && (
              <p className="text-sm text-muted-foreground mt-1">{subText}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Lottie 애니메이션 */}
      <div
        className={cn("flex items-center justify-center", sizeClasses[size])}
      >
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          className="drop-shadow-sm"
        />
      </div>

      {/* 로딩 텍스트 */}
      {showText && (
        <div className="text-center animate-fade-in">
          <p className="text-lg font-medium text-foreground/90 mb-2">
            {text}
            {dots}
          </p>
          {subText && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {subText}
            </p>
          )}
        </div>
      )}

      {/* 선택적 진행률 바 */}
      <div className="w-64 h-1 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full animate-loading-progress" />
      </div>
    </div>
  );
}

// 컴팩트 버전 (작은 영역용)
export function LottieLoadingCompact({
  text,
  size = "sm",
  animationPath = "/lottie/plant_loading.json",
}: Pick<LottieLoadingProps, "text" | "size" | "animationPath">) {
  return (
    <LottieLoading
      text={text}
      size={size}
      animationPath={animationPath}
      fullScreen={false}
      showText={!!text}
    />
  );
}

// 전체 화면 버전
export function LottieLoadingFullScreen({
  text = "페이지를 불러오는 중...",
  subText,
  animationPath = "/lottie/plant_loading.json",
}: Pick<LottieLoadingProps, "text" | "subText" | "animationPath">) {
  return (
    <LottieLoading
      text={text}
      subText={subText}
      animationPath={animationPath}
      fullScreen={true}
      size="xl"
      showText={true}
    />
  );
}
