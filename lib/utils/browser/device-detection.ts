import { Monitor, Smartphone } from "lucide-react";

export interface DeviceInfo {
  type: string;
  icon: any;
  isMobile: boolean;
  isTablet: boolean;
  browser: string;
  os: string;
  userAgent: string;
}

/**
 * 디바이스 정보를 감지하고 반환하는 유틸리티 함수
 * iPadOS 13+ 및 브라우저 감지 순서 보완
 * @returns DeviceInfo 객체
 */
export function getDeviceInfo(): DeviceInfo {
  // SSR 환경 체크
  if (typeof window === "undefined") {
    return {
      type: "Server",
      icon: Monitor,
      isMobile: false,
      isTablet: false,
      browser: "Unknown",
      os: "Unknown",
      userAgent: "Server",
    };
  }

  const userAgent = window.navigator.userAgent;
  // iPadOS 13+ 감지: Mac + 터치포인트 4 이상이면 iPad로 간주
  const isIPadOS =
    /Macintosh/.test(userAgent) && window.navigator.maxTouchPoints >= 4;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || isIPadOS;
  const isAndroid = /Android/.test(userAgent);
  const isWindows = /Windows/.test(userAgent);
  const isMac = /Mac/.test(userAgent) && !isIOS;
  const isLinux = /Linux/.test(userAgent) && !isAndroid;

  // 디바이스 타입 감지
  const isTablet =
    isIPadOS ||
    /iPad/.test(userAgent) ||
    (isAndroid && !/Mobile/.test(userAgent));
  const isMobile = isIOS || (isAndroid && !isTablet);

  // 브라우저 감지 (순서 중요: Edge → Samsung → Chrome → Firefox → Safari)
  let browser = "Other";
  if (/Edg/.test(userAgent)) browser = "Edge";
  else if (/SamsungBrowser/.test(userAgent)) browser = "Samsung";
  else if (/Chrome/.test(userAgent)) browser = "Chrome";
  else if (/Firefox/.test(userAgent)) browser = "Firefox";
  else if (/Safari/.test(userAgent)) browser = "Safari";

  // 운영체제 문자열
  let os = "Other";
  if (isIOS) os = "iOS";
  else if (isAndroid) os = "Android";
  else if (isWindows) os = "Windows";
  else if (isMac) os = "macOS";
  else if (isLinux) os = "Linux";

  // 디바이스 타입 문자열 생성
  let deviceType = `${browser} on ${os}`;
  if (isTablet) {
    deviceType = isIOS ? "Safari on iPad" : `${browser} on Android Tablet`;
  } else if (isMobile) {
    deviceType = isIOS ? "Safari on iPhone" : `${browser} on Android`;
  }

  return {
    type: deviceType,
    icon: isMobile || isTablet ? Smartphone : Monitor,
    isMobile,
    isTablet,
    browser,
    os,
    userAgent,
  };
}

/**
 * Safari 브라우저 여부를 확인하는 함수
 * @returns boolean
 */
export function isSafari(): boolean {
  const { browser } = getDeviceInfo();
  return browser === "Safari";
}

/**
 * iOS Safari 여부를 확인하는 함수
 * @returns boolean
 */
export function isIOSSafari(): boolean {
  const { browser, os } = getDeviceInfo();
  return browser === "Safari" && os === "iOS";
}

/**
 * 모바일 Chrome 여부를 확인하는 함수
 * @returns boolean
 */
export function isMobileChrome(): boolean {
  const { browser, isMobile } = getDeviceInfo();
  return browser === "Chrome" && isMobile;
}

/**
 * Samsung 브라우저 여부를 확인하는 함수
 * @returns boolean
 */
export function isSamsungBrowser(): boolean {
  const { browser } = getDeviceInfo();
  return browser === "Samsung";
}
