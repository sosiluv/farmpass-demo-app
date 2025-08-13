"use client";

import { useState } from "react";
import { ImageZoomModal } from "./image-zoom-modal";
import { ZoomIn } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt?: string;
  title?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  shape?: "square" | "circle" | "rounded";
  showZoomIcon?: boolean;
}

/**
 * 클릭하면 확대 보기 모달이 열리는 이미지 컴포넌트
 * 프로필 이미지, 방문자 이미지, 구성원 이미지 등에 사용
 */
export function ZoomableImage({
  src,
  alt = "이미지",
  title,
  className = "",
  size = "md",
  shape = "rounded",
  showZoomIcon = true,
}: ZoomableImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 크기별 클래스
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  // 모양별 클래스
  const shapeClasses = {
    square: "rounded-none",
    circle: "rounded-full",
    rounded: "rounded-lg",
  };

  return (
    <>
      {/* 클릭 가능한 이미지 */}
      <div
        className="relative group cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className={`
            object-cover transition-all duration-200 
            ${sizeClasses[size]} 
            ${shapeClasses[shape]}
            group-hover:opacity-80 group-hover:scale-105
            ${className}
          `}
          draggable={false}
        />

        {/* 호버 시 확대 아이콘 */}
        {showZoomIcon && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 rounded-full">
            <ZoomIn className="w-4 h-4 text-white drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* 확대 보기 모달 */}
      <ImageZoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={src}
        title={title || alt}
        alt={alt}
      />
    </>
  );
}
