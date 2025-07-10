import React from "react";
import {
  Smartphone,
  Download,
  Share2,
  Menu,
  Chrome,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { getDeviceInfo } from "@/lib/utils/browser/device-detection";

export interface InstallStep {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
}

export interface PlatformGuide {
  platform: string;
  icon: React.ReactNode;
  steps: InstallStep[];
  tips: string[];
}

export const platformGuides: PlatformGuide[] = [
  {
    platform: "iOS Safari",
    icon: <Smartphone className="w-6 h-6" />,
    steps: [
      {
        step: 1,
        title: "공유 버튼 탭",
        description: "Safari 하단의 공유 버튼(□↑)을 탭하세요",
        icon: <Share2 className="w-5 h-5" />,
      },
      {
        step: 2,
        title: "홈 화면에 추가 선택",
        description: "공유 메뉴에서 '홈 화면에 추가'를 선택하세요",
        icon: <Download className="w-5 h-5" />,
      },
      {
        step: 3,
        title: "추가 완료",
        description: "이름을 확인하고 '추가'를 탭하면 완료됩니다",
        icon: <CheckCircle className="w-5 h-5" />,
      },
    ],
    tips: [
      "iOS 16.4 이상에서 PWA 알림이 지원됩니다",
      "홈 화면에서 앱처럼 실행됩니다",
      "오프라인에서도 사용할 수 있습니다",
    ],
  },
  {
    platform: "Android Chrome",
    icon: <Chrome className="w-6 h-6" />,
    steps: [
      {
        step: 1,
        title: "설치 배너 확인",
        description: "주소창 아래에 나타나는 설치 배너를 확인하세요",
        icon: <Download className="w-5 h-5" />,
      },
      {
        step: 2,
        title: "설치 버튼 탭",
        description: "배너의 '설치' 버튼을 탭하세요",
        icon: <ArrowRight className="w-5 h-5" />,
      },
      {
        step: 3,
        title: "설치 완료",
        description: "설치가 완료되면 홈 화면에서 앱을 실행할 수 있습니다",
        icon: <CheckCircle className="w-5 h-5" />,
      },
    ],
    tips: [
      "Chrome 67 이상에서 지원됩니다",
      "푸시 알림을 받을 수 있습니다",
      "백그라운드 동기화가 가능합니다",
    ],
  },
  {
    platform: "Android Samsung Internet",
    icon: <Smartphone className="w-6 h-6" />,
    steps: [
      {
        step: 1,
        title: "메뉴 버튼 탭",
        description: "Samsung Internet 하단의 메뉴 버튼을 탭하세요",
        icon: <Menu className="w-5 h-5" />,
      },
      {
        step: 2,
        title: "홈 화면에 추가 선택",
        description: "메뉴에서 '홈 화면에 추가'를 선택하세요",
        icon: <Download className="w-5 h-5" />,
      },
      {
        step: 3,
        title: "추가 완료",
        description: "확인 후 홈 화면에 아이콘이 추가됩니다",
        icon: <CheckCircle className="w-5 h-5" />,
      },
    ],
    tips: [
      "Samsung Internet 7.2 이상에서 지원됩니다",
      "Samsung 기기에서 최적화된 경험을 제공합니다",
      "다크 모드를 지원합니다",
    ],
  },
  {
    platform: "Desktop Chrome",
    icon: <Chrome className="w-6 h-6" />,
    steps: [
      {
        step: 1,
        title: "설치 아이콘 확인",
        description: "주소창 오른쪽에 나타나는 설치 아이콘(⬇)을 확인하세요",
        icon: <Download className="w-5 h-5" />,
      },
      {
        step: 2,
        title: "설치 버튼 클릭",
        description: "설치 아이콘을 클릭하고 '설치'를 선택하세요",
        icon: <ArrowRight className="w-5 h-5" />,
      },
      {
        step: 3,
        title: "설치 완료",
        description: "데스크톱에 앱이 설치되고 시작 메뉴에 추가됩니다",
        icon: <CheckCircle className="w-5 h-5" />,
      },
    ],
    tips: [
      "Chrome 67 이상에서 지원됩니다",
      "독립적인 창으로 실행됩니다",
      "시스템 알림을 받을 수 있습니다",
    ],
  },
];

export const getCurrentPlatformGuide = (installInfo: any): PlatformGuide => {
  const deviceInfo = getDeviceInfo();
  if (installInfo.platform === "iOS") {
    return platformGuides[0]; // iOS Safari
  } else if (installInfo.platform === "Android") {
    if (deviceInfo.browser === "Samsung") {
      return platformGuides[2]; // Samsung Internet
    }
    return platformGuides[1]; // Android Chrome
  } else if (installInfo.platform === "Desktop") {
    return platformGuides[3]; // Desktop Chrome
  }
  return platformGuides[1]; // 기본값
};
