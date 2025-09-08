import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const useBlockNavigation = (
  shouldBlock: boolean,
  disableBeforeUnload: boolean = false,
  isModalOpen: boolean = false,
  onModalClose?: () => void,
  fallbackUrl: string = ""
) => {
  const router = useRouter();
  const [isAttemptingNavigation, setIsAttemptingNavigation] = useState(false);
  const [nextRoute, setNextRoute] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isModalOpen) {
        return;
      }
      if (shouldBlock && !disableBeforeUnload) {
        event.preventDefault();
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldBlock, disableBeforeUnload, isModalOpen]);

  useEffect(() => {
    const handleBackButton = (event: PopStateEvent) => {
      if (shouldBlock) {
        if (isModalOpen && onModalClose) {
          onModalClose();
          return;
        }
        setIsAttemptingNavigation(true);
        setNextRoute(fallbackUrl);
      }
    };

    console.log("shouldBlock", shouldBlock);
    // shouldBlock이 true일 때만 히스토리 조작
    if (shouldBlock) {
      history.pushState(null, "", window.location.href);
    }
    window.addEventListener("popstate", handleBackButton);
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [shouldBlock, fallbackUrl, isModalOpen, onModalClose]);

  const proceedNavigation = () => {
    if (nextRoute && nextRoute.trim() !== "") {
      setIsAttemptingNavigation(false);

      // 모달/시트 닫기 함수가 있으면 실행
      if (onModalClose) {
        onModalClose();
      }

      setTimeout(() => {
        router.replace(nextRoute);
      }, 100);
      setNextRoute(null);
    } else {
      history.go(-1);
    }
  };

  const cancelNavigation = () => {
    setIsAttemptingNavigation(false);
    setNextRoute(null);
  };

  return { isAttemptingNavigation, proceedNavigation, cancelNavigation };
};

export default useBlockNavigation;
