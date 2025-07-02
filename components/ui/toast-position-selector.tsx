"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useToastPosition } from "@/components/providers/toast-position-provider";
import {
  Monitor,
  Smartphone,
  Check,
  Github,
  CreditCard,
  Zap,
  MessageSquare,
  Hash,
  Figma,
} from "lucide-react";

type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface PositionOption {
  id: ToastPosition;
  name: string;
  description: string;
  className: string;
  usedBy: Array<{
    name: string;
    icon: React.ReactNode;
    color: string;
  }>;
  recommended?: boolean;
}

const positionOptions: PositionOption[] = [
  {
    id: "top-center",
    name: "상단 중앙",
    description: "중요한 알림에 적합 (기본값)",
    className:
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col items-center p-4 md:max-w-[420px]",
    recommended: true,
    usedBy: [
      {
        name: "GitHub",
        icon: <Github className="w-4 h-4" />,
        color: "bg-gray-900",
      },
      {
        name: "Linear",
        icon: <Zap className="w-4 h-4" />,
        color: "bg-purple-600",
      },
    ],
  },
  {
    id: "top-right",
    name: "우상단",
    description: "실시간 알림에 적합",
    className: "fixed top-4 right-4 z-[100] flex flex-col p-4 md:max-w-[420px]",
    usedBy: [
      {
        name: "Slack",
        icon: <Hash className="w-4 h-4" />,
        color: "bg-green-600",
      },
      {
        name: "Figma",
        icon: <Figma className="w-4 h-4" />,
        color: "bg-red-500",
      },
    ],
  },
  {
    id: "bottom-right",
    name: "우하단",
    description: "많은 서비스에서 사용",
    className:
      "fixed bottom-4 right-4 z-[100] flex flex-col p-4 md:max-w-[420px]",
    usedBy: [
      {
        name: "Stripe",
        icon: <CreditCard className="w-4 h-4" />,
        color: "bg-blue-600",
      },
      { name: "Vercel", icon: <Zap className="w-4 h-4" />, color: "bg-black" },
      {
        name: "Notion",
        icon: <Monitor className="w-4 h-4" />,
        color: "bg-gray-800",
      },
    ],
  },
  {
    id: "bottom-left",
    name: "좌하단",
    description: "채팅 앱에서 인기",
    className:
      "fixed bottom-4 left-4 z-[100] flex flex-col p-4 md:max-w-[420px]",
    usedBy: [
      {
        name: "Discord",
        icon: <MessageSquare className="w-4 h-4" />,
        color: "bg-indigo-600",
      },
    ],
  },
  {
    id: "bottom-center",
    name: "하단 중앙",
    description: "모바일 친화적",
    className:
      "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col items-center p-4 md:max-w-[420px]",
    usedBy: [],
  },
  {
    id: "top-left",
    name: "좌상단",
    description: "시스템 알림 스타일",
    className: "fixed top-4 left-4 z-[100] flex flex-col p-4 md:max-w-[420px]",
    usedBy: [],
  },
];

interface ToastPositionSelectorProps {
  currentPosition?: ToastPosition;
  onPositionChange?: (position: ToastPosition) => void;
  showPreview?: boolean;
}

export function ToastPositionSelector({
  currentPosition,
  onPositionChange,
  showPreview = true,
}: ToastPositionSelectorProps) {
  const { toast } = useToast();
  const { position, setPosition } = useToastPosition();

  const handlePositionSelect = useCallback(
    (newPosition: ToastPosition) => {
      if (position === newPosition) return; // 같은 위치 선택 시 무시

      // Context를 통해 위치 변경
      setPosition(newPosition);

      // 외부 콜백 호출 (선택적)
      onPositionChange?.(newPosition);

      // 내부에서 토스트 표시 (디바운스 적용)
      setTimeout(() => {
        toast({
          title: "토스트 위치 변경",
          description: "새로운 위치에서 토스트가 표시됩니다.",
        });
      }, 300);
    },
    [position, setPosition, onPositionChange, toast]
  );

  // useEffect는 ToastPositionProvider에서 처리하므로 제거

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          토스트 알림 위치 설정
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          유명한 웹앱들이 사용하는 토스트 위치를 선택하세요
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {positionOptions.map((option) => (
            <div
              key={option.id}
              className={`relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                position === option.id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handlePositionSelect(option.id)}
            >
              {/* 선택 표시 */}
              {position === option.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* 추천 배지 */}
              {option.recommended && (
                <Badge className="absolute top-2 left-2 bg-green-500">
                  추천
                </Badge>
              )}

              {/* 위치 정보 */}
              <div className="mb-3">
                <h3 className="font-semibold text-sm mb-1">{option.name}</h3>
                <p className="text-xs text-gray-600">{option.description}</p>
              </div>

              {/* 사용하는 서비스들 */}
              {option.usedBy.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">사용하는 서비스:</p>
                  <div className="flex flex-wrap gap-1">
                    {option.usedBy.map((service, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-white text-xs ${service.color}`}
                      >
                        {service.icon}
                        {service.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 미리보기 영역 */}
              {showPreview && (
                <div className="relative bg-gray-100 rounded h-20 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                    <Monitor className="w-8 h-8" />
                  </div>
                  {/* 토스트 위치 표시 */}
                  <div
                    className={`absolute w-8 h-4 bg-blue-500 rounded-sm ${
                      option.id.includes("top") ? "top-1" : "bottom-1"
                    } ${
                      option.id.includes("left")
                        ? "left-1"
                        : option.id.includes("right")
                        ? "right-1"
                        : "left-1/2 transform -translate-x-1/2"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 모바일 안내 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 text-sm mb-1">
                모바일 최적화
              </h4>
              <p className="text-xs text-blue-700">
                모바일에서는 화면 크기에 맞게 자동으로 조정됩니다. 하단 위치가
                엄지손가락 접근성이 좋습니다.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
