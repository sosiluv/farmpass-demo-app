"use client";

import { useLogo } from "@/hooks/use-logo";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { SystemSettings } from "@/lib/types/settings";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  textClassName?: string;
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  settings?: SystemSettings | null; // 중복 query 방지용
}

const sizeMap = {
  sm: {
    container: "h-8 w-8",
    icon: "h-5 w-5",
    text: "text-sm",
  },
  md: {
    container: "h-10 w-10",
    icon: "h-6 w-6",
    text: "text-base",
  },
  lg: {
    container: "h-14 w-28",
    icon: "h-8 w-8",
    text: "text-lg",
  },
  xl: {
    container: "h-16 w-40",
    icon: "h-10 w-10",
    text: "text-sm",
  },
  xxl: {
    container: "h-24 w-40",
    icon: "h-16 w-16",
    text: "text-xl",
  },
};

/**
 * 시스템 로고 표시 컴포넌트
 * 업로드된 로고가 있으면 이미지를, 없으면 기본 로고를 표시
 */
export function Logo({
  className,
  iconClassName,
  showText = false,
  textClassName,
  size = "md",
  settings, // 중복 query 방지용
}: LogoProps) {
  const { logoUrl, siteName } = useLogo(settings);
  const sizeConfig = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-lg",
          sizeConfig.container,
          iconClassName
        )}
      >
        <Image
          src={logoUrl}
          alt={siteName}
          fill
          priority
          className="object-contain"
          sizes="(max-width: 768px) 32px, 40px"
        />
      </div>
      {showText && (
        <span className={cn("font-semibold", sizeConfig.text, textClassName)}>
          {siteName}
        </span>
      )}
    </div>
  );
}
