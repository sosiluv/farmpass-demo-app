import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024; // iPad Pro(1024px)와 iPad Air를 태블릿으로 인식하도록 수정

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

// 태블릿 감지 훅 추가
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${
        TABLET_BREAKPOINT - 1
      }px)`
    );
    const onChange = () => {
      setIsTablet(
        window.innerWidth >= MOBILE_BREAKPOINT &&
          window.innerWidth < TABLET_BREAKPOINT
      );
    };
    mql.addEventListener("change", onChange);
    setIsTablet(
      window.innerWidth >= MOBILE_BREAKPOINT &&
        window.innerWidth < TABLET_BREAKPOINT
    );
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isTablet;
}

// 모바일 또는 태블릿 감지 훅 (단순화된 버전)
export function useIsMobileOrTablet() {
  const [isMobileOrTablet, setIsMobileOrTablet] = React.useState<
    boolean | undefined
  >(undefined);

  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;

      // 1400px 미만이면 모바일/태블릿으로 간주 (단순화)
      const isMobileOrTabletDevice = width < TABLET_BREAKPOINT;

      setIsMobileOrTablet(isMobileOrTabletDevice);
    };

    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", checkDevice);
    checkDevice();

    return () => mql.removeEventListener("change", checkDevice);
  }, []);

  return !!isMobileOrTablet;
}
