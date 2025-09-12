/**
 * 데모 계정 정보
 * 실제 운영 환경에서는 이 파일을 제거하거나 환경변수로 관리해야 합니다.
 */

export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "owner" | "manager" | "viewer";
  description: string;
  avatar?: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "demo-admin",
    name: "관리자",
    email: "admin@demo.com",
    password: "demo123!",
    role: "admin",
    description: "시스템 전체 관리 권한",
    avatar: "👨‍💼",
  },
  {
    id: "demo-owner",
    name: "농장주",
    email: "owner@demo.com",
    password: "demo123!",
    role: "owner",
    description: "농장 소유자 권한",
    avatar: "👨‍🌾",
  },
  {
    id: "demo-manager",
    name: "농장 관리자",
    email: "manager@demo.com",
    password: "demo123!",
    role: "manager",
    description: "농장 운영 관리 권한",
    avatar: "👩‍💼",
  },
  {
    id: "demo-viewer",
    name: "조회자",
    email: "viewer@demo.com",
    password: "demo123!",
    role: "viewer",
    description: "데이터 조회만 가능",
    avatar: "👀",
  },
];

export const DEMO_LOGIN_CONFIG = {
  title: "데모 체험",
  subtitle: "다양한 권한으로 체험해보세요",
  buttonText: "데모 로그인",
} as const;
