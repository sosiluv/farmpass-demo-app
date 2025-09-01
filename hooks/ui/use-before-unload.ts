import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const useBlockNavigation = (
  shouldBlock: boolean,
  fallbackUrl: string = "/",
  disableBeforeUnload: boolean = false
) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isAttemptingNavigation, setIsAttemptingNavigation] = useState(false);
  const [nextRoute, setNextRoute] = useState<string | null>(null);
  const originalPushRef = useRef(router.push);
  const lastLocationRef = useRef<string | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldBlock && !disableBeforeUnload) {
        event.preventDefault();
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldBlock, disableBeforeUnload]);

  useEffect(() => {
    const handleBackButton = (event: PopStateEvent) => {
      if (shouldBlock) {
        // fallbackUrl로 이동하도록 설정
        setIsAttemptingNavigation(true);
        setNextRoute(fallbackUrl);
        history.pushState(null, "", window.location.href);
      }
    };

    lastLocationRef.current = pathname;
    history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBackButton);
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [shouldBlock, pathname, fallbackUrl]);

  const proceedNavigation = () => {
    if (nextRoute) {
      setIsAttemptingNavigation(false);
      console.log("📍 이동할 URL:", nextRoute);
      originalPushRef.current(nextRoute);
      setNextRoute(null);
    }
  };

  const cancelNavigation = () => {
    setIsAttemptingNavigation(false);
    setNextRoute(null);
  };

  return { isAttemptingNavigation, proceedNavigation, cancelNavigation };
};

export default useBlockNavigation;
