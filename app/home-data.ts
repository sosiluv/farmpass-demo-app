import { QrCode, Shield, Users, Bell, BarChart3, Leaf } from "lucide-react";

interface Feature {
  icon: any; // lucide-react 아이콘 컴포넌트 타입
  title: string;
  description: string;
}

interface Step {
  title: string;
  description: string;
}

export const features: Feature[] = [
  {
    icon: QrCode,
    title: "QR 코드 방문 등록",
    description:
      "방문자가 QR 코드를 스캔하여 빠르고 간편하게 방문 정보를 등록할 수 있습니다.",
  },
  {
    icon: Shield,
    title: "방역 관리",
    description:
      "방문자의 소독 여부를 확인하고 기록하여 농장의 생물학적 안전을 강화합니다.",
  },
  {
    icon: Users,
    title: "방문자 데이터 관리",
    description:
      "모든 방문자 정보를 체계적으로 관리하고 필요시 빠르게 검색할 수 있습니다.",
  },
  {
    icon: Bell,
    title: "실시간 알림",
    description:
      "새로운 방문자가 등록되면 즉시 알림을 받아 신속하게 대응할 수 있습니다.",
  },
  {
    icon: BarChart3,
    title: "통계 및 분석",
    description:
      "방문자 데이터를 분석하여 트렌드를 파악하고 더 나은 의사결정을 내릴 수 있습니다.",
  },
  {
    icon: Leaf,
    title: "다중 농장 지원",
    description:
      "여러 농장을 하나의 계정으로 관리하여 효율성을 극대화할 수 있습니다.",
  },
];

export const steps: Step[] = [
  {
    title: "계정 생성",
    description: "간단한 정보 입력으로 계정을 생성하고 농장을 등록합니다.",
  },
  {
    title: "QR 코드 생성",
    description:
      "각 농장별 고유 QR 코드를 생성하고 방문자 출입구에 배치합니다.",
  },
  {
    title: "방문자 관리",
    description: "대시보드에서 모든 방문 기록을 확인하고 관리합니다.",
  },
];
