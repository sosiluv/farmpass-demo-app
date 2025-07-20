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
import { LABELS } from "@/lib/constants/common";

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
    platform: LABELS.INSTALL_GUIDE_PLATFORM_IOS_SAFARI,
    icon: <Smartphone className="w-6 h-6" />,
    steps: [
      {
        step: 1,
        title: LABELS.INSTALL_GUIDE_IOS_STEP1_TITLE,
        description: LABELS.INSTALL_GUIDE_IOS_STEP1_DESC,
        icon: <Share2 className="w-5 h-5" />,
      },
      {
        step: 2,
        title: LABELS.INSTALL_GUIDE_IOS_STEP2_TITLE,
        description: LABELS.INSTALL_GUIDE_IOS_STEP2_DESC,
        icon: <Download className="w-5 h-5" />,
      },
      {
        step: 3,
        title: LABELS.INSTALL_GUIDE_IOS_STEP3_TITLE,
        description: LABELS.INSTALL_GUIDE_IOS_STEP3_DESC,
        icon: <CheckCircle className="w-5 h-5" />,
      },
    ],
    tips: [
      LABELS.INSTALL_GUIDE_IOS_TIP1,
      LABELS.INSTALL_GUIDE_IOS_TIP2,
      LABELS.INSTALL_GUIDE_IOS_TIP3,
    ],
  },
  {
    platform: LABELS.INSTALL_GUIDE_PLATFORM_ANDROID_CHROME,
    icon: <Chrome className="w-6 h-6" />,
    steps: [
      {
        step: 1,
        title: LABELS.INSTALL_GUIDE_ANDROID_STEP1_TITLE,
        description: LABELS.INSTALL_GUIDE_ANDROID_STEP1_DESC,
        icon: <Download className="w-5 h-5" />,
      },
      {
        step: 2,
        title: LABELS.INSTALL_GUIDE_ANDROID_STEP2_TITLE,
        description: LABELS.INSTALL_GUIDE_ANDROID_STEP2_DESC,
        icon: <ArrowRight className="w-5 h-5" />,
      },
      {
        step: 3,
        title: LABELS.INSTALL_GUIDE_ANDROID_STEP3_TITLE,
        description: LABELS.INSTALL_GUIDE_ANDROID_STEP3_DESC,
        icon: <CheckCircle className="w-5 h-5" />,
      },
    ],
    tips: [
      LABELS.INSTALL_GUIDE_ANDROID_TIP1,
      LABELS.INSTALL_GUIDE_ANDROID_TIP2,
      LABELS.INSTALL_GUIDE_ANDROID_TIP3,
    ],
  },
  {
    platform: LABELS.INSTALL_GUIDE_PLATFORM_SAMSUNG_INTERNET,
    icon: <Smartphone className="w-6 h-6" />,
    steps: [
      {
        step: 1,
        title: LABELS.INSTALL_GUIDE_SAMSUNG_STEP1_TITLE,
        description: LABELS.INSTALL_GUIDE_SAMSUNG_STEP1_DESC,
        icon: <Menu className="w-5 h-5" />,
      },
      {
        step: 2,
        title: LABELS.INSTALL_GUIDE_SAMSUNG_STEP2_TITLE,
        description: LABELS.INSTALL_GUIDE_SAMSUNG_STEP2_DESC,
        icon: <Download className="w-5 h-5" />,
      },
      {
        step: 3,
        title: LABELS.INSTALL_GUIDE_SAMSUNG_STEP3_TITLE,
        description: LABELS.INSTALL_GUIDE_SAMSUNG_STEP3_DESC,
        icon: <CheckCircle className="w-5 h-5" />,
      },
    ],
    tips: [
      LABELS.INSTALL_GUIDE_SAMSUNG_TIP1,
      LABELS.INSTALL_GUIDE_SAMSUNG_TIP2,
      LABELS.INSTALL_GUIDE_SAMSUNG_TIP3,
    ],
  },
  {
    platform: LABELS.INSTALL_GUIDE_PLATFORM_DESKTOP_CHROME,
    icon: <Chrome className="w-6 h-6" />,
    steps: [
      {
        step: 1,
        title: LABELS.INSTALL_GUIDE_DESKTOP_STEP1_TITLE,
        description: LABELS.INSTALL_GUIDE_DESKTOP_STEP1_DESC,
        icon: <Download className="w-5 h-5" />,
      },
      {
        step: 2,
        title: LABELS.INSTALL_GUIDE_DESKTOP_STEP2_TITLE,
        description: LABELS.INSTALL_GUIDE_DESKTOP_STEP2_DESC,
        icon: <ArrowRight className="w-5 h-5" />,
      },
      {
        step: 3,
        title: LABELS.INSTALL_GUIDE_DESKTOP_STEP3_TITLE,
        description: LABELS.INSTALL_GUIDE_DESKTOP_STEP3_DESC,
        icon: <CheckCircle className="w-5 h-5" />,
      },
    ],
    tips: [
      LABELS.INSTALL_GUIDE_DESKTOP_TIP1,
      LABELS.INSTALL_GUIDE_DESKTOP_TIP2,
      LABELS.INSTALL_GUIDE_DESKTOP_TIP3,
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
