"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Smartphone,
  Globe,
  Wifi,
  WifiOff,
  FileText,
  Loader2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { generateDeviceId } from "@/lib/utils/notification/push-subscription";

interface PushTestState {
  isSupported: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  vapidPublicKey: string | null;
  isOnline: boolean;
  isPWA: boolean;
}

export default function PushNotificationTestPage() {
  const [testState, setTestState] = useState<PushTestState>({
    isSupported: false,
    permission: "default",
    subscription: null,
    vapidPublicKey: null,
    isOnline: navigator.onLine,
    isPWA: false,
  });

  const [testMessage, setTestMessage] = useState("테스트 알림입니다!");
  const [testTitle, setTestTitle] = useState("농장 방문자 알림");
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "warning" | "info";
      message: string;
      timestamp: Date;
    }>
  >([]);

  // 커스텀 방문자 등록 알림 폼 상태
  const [customFarmId, setCustomFarmId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  // 환경 체크
  useEffect(() => {
    const checkEnvironment = async () => {
      const results = [];

      // 1. 웹푸시 지원 여부
      const isSupported =
        "serviceWorker" in navigator && "PushManager" in window;
      if (!isSupported) {
        results.push({
          id: "1",
          type: "error" as const,
          message: "이 브라우저는 웹푸시를 지원하지 않습니다.",
          timestamp: new Date(),
        });
      } else {
        results.push({
          id: "1",
          type: "success" as const,
          message: "웹푸시 지원 확인됨",
          timestamp: new Date(),
        });
      }

      // 2. HTTPS 체크
      if (location.protocol !== "https:" && location.hostname !== "localhost") {
        results.push({
          id: "2",
          type: "error" as const,
          message: "웹푸시는 HTTPS 환경에서만 작동합니다.",
          timestamp: new Date(),
        });
      } else {
        results.push({
          id: "2",
          type: "success" as const,
          message: "HTTPS 환경 확인됨",
          timestamp: new Date(),
        });
      }

      // 3. PWA 체크
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      if (isPWA) {
        results.push({
          id: "3",
          type: "success" as const,
          message: "PWA 모드에서 실행 중 (웹푸시 최적화됨)",
          timestamp: new Date(),
        });
      } else {
        results.push({
          id: "3",
          type: "warning" as const,
          message: "일반 브라우저 모드 (PWA 설치 권장)",
          timestamp: new Date(),
        });
      }

      // 4. 온라인 상태 체크
      if (navigator.onLine) {
        results.push({
          id: "4",
          type: "success" as const,
          message: "온라인 상태 확인됨",
          timestamp: new Date(),
        });
      } else {
        results.push({
          id: "4",
          type: "warning" as const,
          message: "오프라인 상태 (웹푸시 수신 불가)",
          timestamp: new Date(),
        });
      }

      setTestResults(results);
      setTestState((prev) => ({
        ...prev,
        isSupported,
        isPWA,
        isOnline: navigator.onLine,
      }));
    };

    checkEnvironment();
  }, []);

  // 권한 상태 체크
  useEffect(() => {
    if ("Notification" in window) {
      setTestState((prev) => ({
        ...prev,
        permission: Notification.permission,
      }));
    }
  }, []);

  // VAPID 키 가져오기
  useEffect(() => {
    const getVapidKey = async () => {
      try {
        const response = await fetch("/api/push/vapid");
        if (response.ok) {
          const data = await response.json();
          setTestState((prev) => ({
            ...prev,
            vapidPublicKey: data.publicKey,
          }));
        }
      } catch (error) {
        console.error("VAPID 키 조회 실패:", error);
      }
    };

    getVapidKey();
  }, []);

  // 구독 상태 체크 함수
  const checkSubscription = useCallback(async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setTestState((prev) => ({
            ...prev,
            subscription,
          }));
        }
      } catch (error) {
        console.error("구독 상태 확인 실패:", error);
      }
    }
  }, []);

  // 초기 구독 상태 체크
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // 권한 요청
  const requestPermission = async () => {
    try {
      setIsLoading(true);
      const permission = await Notification.requestPermission();
      setTestState((prev) => ({ ...prev, permission }));

      if (permission === "granted") {
        // 권한 변경 후 구독 상태도 다시 확인
        await checkSubscription();
        setIsLoading(false); // 먼저 로딩 상태 해제
        toast.success("알림 권한이 허용되었습니다!");
        setTestResults((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "success",
            message: "알림 권한 허용됨",
            timestamp: new Date(),
          },
        ]);
      } else {
        setIsLoading(false); // 거부 시에도 로딩 상태 해제
        toast.error("알림 권한이 거부되었습니다.");
        setTestResults((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "error",
            message: "알림 권한 거부됨",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      setIsLoading(false); // 에러 시에도 로딩 상태 해제
      toast.error("권한 요청 중 오류가 발생했습니다.");
    }
  };

  // 구독 등록
  const subscribeToPush = async () => {
    try {
      setIsLoading(true);

      if (!testState.vapidPublicKey) {
        toast.error("VAPID 키를 가져올 수 없습니다.");
        console.error("VAPID 키 없음:", testState.vapidPublicKey);
        return;
      }

      console.log("사용할 VAPID 키:", testState.vapidPublicKey);

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: testState.vapidPublicKey,
      });

      // device_id 생성 (공통 함수 사용)
      const deviceId = generateDeviceId();

      // 구독 데이터 확인
      console.log("전송할 구독 데이터:", subscription);
      console.log("생성된 device_id:", deviceId);

      // 서버에 구독 정보 전송 (device_id 포함)
      const response = await fetch("/api/push/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          deviceId,
          options: {
            updateSettings: true, // 테스트에서도 설정 업데이트
          },
        }),
      });

      if (response.ok) {
        // 실제 구독 상태를 다시 확인하여 업데이트
        const actualSubscription =
          await registration.pushManager.getSubscription();
        console.log("구독 등록 후 실제 구독 상태:", actualSubscription);
        setTestState((prev) => ({ ...prev, subscription: actualSubscription }));
        setIsLoading(false); // 먼저 로딩 상태 해제
        toast.success("웹푸시 구독이 완료되었습니다!");
        setTestResults((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "success",
            message: "웹푸시 구독 완료",
            timestamp: new Date(),
          },
        ]);
      } else {
        const errorData = await response.json();
        console.error("구독 등록 실패 응답:", errorData);
        throw new Error(
          `구독 등록 실패: ${
            errorData.message || errorData.error || "알 수 없는 오류"
          }`
        );
      }
    } catch (error) {
      console.error("구독 실패:", error);
      setIsLoading(false); // 에러 시에도 로딩 상태 해제
      toast.error("웹푸시 구독에 실패했습니다.");
      setTestResults((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "error",
          message: "웹푸시 구독 실패",
          timestamp: new Date(),
        },
      ]);
    }
  };

  // 구독 해제
  const unsubscribeFromPush = async () => {
    try {
      setIsLoading(true);

      if (testState.subscription) {
        await testState.subscription.unsubscribe();

        // 구독 해제 데이터 확인
        console.log("해제할 구독 데이터:", testState.subscription);

        const response = await fetch("/api/push/subscription", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: testState.subscription?.endpoint,
            options: {
              updateSettings: true, // 테스트에서도 설정 업데이트
            },
          }),
        });

        if (response.ok) {
          // 실제 구독 상태를 다시 확인하여 업데이트
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            const actualSubscription =
              await registration.pushManager.getSubscription();
            console.log("구독 해제 후 실제 구독 상태:", actualSubscription);
            setTestState((prev) => ({
              ...prev,
              subscription: actualSubscription,
            }));
          }
          setIsLoading(false); // 먼저 로딩 상태 해제
          toast.success("웹푸시 구독이 해제되었습니다.");
          setTestResults((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: "success",
              message: "웹푸시 구독 해제 완료",
              timestamp: new Date(),
            },
          ]);
        } else {
          const errorData = await response.json();
          console.error("구독 해제 실패 응답:", errorData);
          throw new Error(
            `구독 해제 실패: ${
              errorData.message || errorData.error || "알 수 없는 오류"
            }`
          );
        }
      }
    } catch (error) {
      console.error("구독 해제 실패:", error);
      setIsLoading(false); // 에러 시에도 로딩 상태 해제
      toast.error("구독 해제에 실패했습니다.");
    }
  };

  // 테스트 알림 전송
  const sendTestNotification = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: testTitle,
          message: testMessage, // body 대신 message 사용
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: "test-notification",
          notificationType: "notice", // 허용된 알림 타입 사용
          test: true, // 테스트 모드로 필터링 우회
          data: {
            url: window.location.origin,
            timestamp: Date.now(),
          },
        }),
      });

      if (response.ok) {
        toast.success("테스트 알림이 전송되었습니다!");
        setTestResults((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "success",
            message: "테스트 알림 전송 완료",
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error("알림 전송 실패");
      }
    } catch (error) {
      console.error("알림 전송 실패:", error);
      toast.error("테스트 알림 전송에 실패했습니다.");
      setTestResults((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "error",
          message: "테스트 알림 전송 실패",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 로컬 알림 테스트
  const sendLocalNotification = () => {
    if (Notification.permission === "granted") {
      new Notification(testTitle, {
        body: testMessage,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "local-test",
        data: {
          url: window.location.origin,
          timestamp: Date.now(),
        },
      });

      toast.success("로컬 테스트 알림이 전송되었습니다!");
      setTestResults((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "success",
          message: "로컬 테스트 알림 전송 완료",
          timestamp: new Date(),
        },
      ]);
    } else {
      toast.error("알림 권한이 필요합니다.");
    }
  };

  const getStatusIcon = (type: "success" | "error" | "warning" | "info") => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">웹푸시 알림 테스트</h1>
          <p className="text-muted-foreground">
            Vercel 환경에서 웹푸시 알림 기능을 실전 테스트합니다.
          </p>
        </div>
        <Badge variant={testState.isOnline ? "default" : "destructive"}>
          {testState.isOnline ? (
            <>
              <Wifi className="h-3 w-3 mr-1" />
              온라인
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 mr-1" />
              오프라인
            </>
          )}
        </Badge>
      </div>

      {/* 환경 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            환경 상태
          </CardTitle>
          <CardDescription>
            웹푸시 알림 작동을 위한 환경 요구사항을 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testResults.map((result) => (
            <div
              key={result.id}
              className="flex items-center gap-3 p-3 border rounded-lg"
            >
              {getStatusIcon(result.type)}
              <span className="flex-1">{result.message}</span>
              <span className="text-xs text-muted-foreground">
                {result.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 권한 및 구독 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            권한 및 구독 상태
          </CardTitle>
          <CardDescription>
            알림 권한과 웹푸시 구독 상태를 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">알림 권한</p>
              <p className="text-sm text-muted-foreground">
                {testState.permission === "granted" && "허용됨"}
                {testState.permission === "denied" && "거부됨"}
                {testState.permission === "default" && "요청 필요"}
              </p>
            </div>
            <Badge
              variant={
                testState.permission === "granted"
                  ? "default"
                  : testState.permission === "denied"
                  ? "destructive"
                  : "secondary"
              }
            >
              {testState.permission}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">웹푸시 구독</p>
              <p className="text-sm text-muted-foreground">
                {testState.subscription ? "구독 중" : "구독되지 않음"}
              </p>
            </div>
            <Badge variant={testState.subscription ? "default" : "secondary"}>
              {testState.subscription ? "구독됨" : "미구독"}
            </Badge>
          </div>

          <div className="flex gap-2">
            {testState.permission !== "granted" && (
              <Button onClick={requestPermission} disabled={isLoading}>
                권한 요청
              </Button>
            )}

            {testState.permission === "granted" && !testState.subscription && (
              <Button onClick={subscribeToPush} disabled={isLoading}>
                구독 등록
              </Button>
            )}

            {testState.subscription && (
              <Button
                variant="outline"
                onClick={unsubscribeFromPush}
                disabled={isLoading}
              >
                구독 해제
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 테스트 알림 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            알림 테스트
          </CardTitle>
          <CardDescription>실제 웹푸시 알림을 테스트해봅니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-title">알림 제목</Label>
            <Input
              id="test-title"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="알림 제목을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-message">알림 내용</Label>
            <Textarea
              id="test-message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="알림 내용을 입력하세요"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={sendLocalNotification}
              disabled={testState.permission !== "granted" || isLoading}
              variant="outline"
            >
              로컬 알림 테스트
            </Button>

            <Button
              onClick={sendTestNotification}
              disabled={!testState.subscription || isLoading}
            >
              웹푸시 알림 테스트
            </Button>

            {/* 농장별 방문자 등록 알림 테스트 */}
            <Button
              onClick={async () => {
                setIsLoading(true);
                try {
                  const response = await fetch("/api/push/send", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      title: "방문자 등록 알림",
                      message: "새 방문자가 등록되었습니다.",
                      notificationType: "visitor",
                      farmId: "3d5f33f1-cff9-4a18-970b-6edaca7c61e6",
                      icon: "/icon-192x192.png",
                      badge: "/icon-192x192.png",
                      tag: "visitor-test",
                      data: {
                        url: window.location.origin,
                        farmId: "3d5f33f1-cff9-4a18-970b-6edaca7c61e6",
                        timestamp: Date.now(),
                      },
                    }),
                  });
                  const result = await response.json();
                  console.log("방문자 등록 알림 결과:", result);
                  toast.success("방문자 등록 알림 테스트 완료!");
                } catch (e) {
                  toast.error("방문자 등록 알림 테스트 실패");
                } finally {
                  setIsLoading(false);
                }
              }}
              variant="outline"
            >
              3d5f33f1 농장 방문자 등록 알림 테스트
            </Button>
          </div>

          {/* 커스텀 방문자 등록 알림 폼 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>커스텀 방문자 등록 알림 테스트</CardTitle>
              <CardDescription>
                farmId, 제목, 메시지를 직접 입력해서 특정 농장에 방문자 등록
                알림을 보낼 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-farmid">farmId</Label>
                <Input
                  id="custom-farmid"
                  value={customFarmId}
                  onChange={(e) => setCustomFarmId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-title">제목</Label>
                <Input
                  id="custom-title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-message">메시지</Label>
                <Textarea
                  id="custom-message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>
              <Button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const response = await fetch("/api/push/send", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: customTitle,
                        message: customMessage,
                        notificationType: "visitor",
                        farmId: customFarmId,
                        icon: "/icon-192x192.png",
                        badge: "/icon-192x192.png",
                        tag: "visitor-test",
                        data: {
                          url: window.location.origin,
                          farmId: customFarmId,
                          timestamp: Date.now(),
                        },
                      }),
                    });
                    const result = await response.json();
                    console.log("커스텀 방문자 등록 알림 결과:", result);
                    toast.success("커스텀 방문자 등록 알림 테스트 완료!");
                  } catch (e) {
                    toast.error("커스텀 방문자 등록 알림 테스트 실패");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={
                  isLoading || !customFarmId || !customTitle || !customMessage
                }
              >
                커스텀 방문자 등록 알림 전송
              </Button>
            </CardContent>
          </Card>

          {/* 🧪 회원가입 실시간 테스트 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                회원가입 실시간 업데이트 테스트
              </CardTitle>
              <CardDescription>
                회원가입 API와 실시간 브로드캐스트 기능을 테스트합니다. 관리자
                대시보드에서 실시간 업데이트를 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={async () => {
                  setTestResults((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      type: "info",
                      message:
                        "🧪 회원가입 실시간 브로드캐스트 테스트를 실행합니다...",
                      timestamp: new Date(),
                    },
                  ]);

                  try {
                    // 테스트용 임시 이메일 생성
                    const testEmail = `test_${Date.now()}@example.com`;

                    // 회원가입 API 직접 호출 (내부 API 방식)
                    const response = await fetch("/api/auth/register", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        email: testEmail,
                        password: "TestPassword123!",
                        name: "테스트 사용자",
                        phone: "010-1234-5678",
                        turnstileToken: "test-token", // 테스트용
                      }),
                    });

                    const result = await response.json();

                    if (result.success) {
                      setTestResults((prev) => [
                        ...prev,
                        {
                          id: Date.now().toString(),
                          type: "success",
                          message: `✅ 회원가입 성공! 이메일: ${testEmail} - 관리자 대시보드에서 실시간 업데이트를 확인하세요.`,
                          timestamp: new Date(),
                        },
                      ]);
                      toast.success(
                        "회원가입 테스트 성공! 관리자 대시보드에서 실시간 업데이트를 확인하세요."
                      );
                    } else {
                      setTestResults((prev) => [
                        ...prev,
                        {
                          id: Date.now().toString(),
                          type: "error",
                          message: `❌ 회원가입 실패: ${result.message}`,
                          timestamp: new Date(),
                        },
                      ]);
                      toast.error(`회원가입 테스트 실패: ${result.message}`);
                    }
                  } catch (error) {
                    setTestResults((prev) => [
                      ...prev,
                      {
                        id: Date.now().toString(),
                        type: "error",
                        message: `💥 회원가입 테스트 오류: ${
                          error instanceof Error ? error.message : String(error)
                        }`,
                        timestamp: new Date(),
                      },
                    ]);
                    toast.error(
                      `회원가입 테스트 오류: ${
                        error instanceof Error ? error.message : String(error)
                      }`
                    );
                  }
                }}
                className="w-full"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                회원가입 실시간 브로드캐스트 테스트
              </Button>
              <div className="text-sm text-muted-foreground">
                이 버튼을 클릭하면 테스트용 회원가입이 생성되고, 관리자
                대시보드의 "사용자 통계"에서 실시간으로 업데이트되는지 확인할 수
                있습니다.
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              웹푸시 알림 테스트는 구독이 완료된 후에만 가능합니다. 로컬 알림은
              권한만 있으면 즉시 테스트할 수 있습니다.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 디버그 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>디버그 정보</CardTitle>
          <CardDescription>현재 환경의 상세 정보를 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>브라우저:</span>
              <span>{navigator.userAgent}</span>
            </div>
            <div className="flex justify-between">
              <span>URL:</span>
              <span>{window.location.href}</span>
            </div>
            <div className="flex justify-between">
              <span>PWA 모드:</span>
              <span>{testState.isPWA ? "예" : "아니오"}</span>
            </div>
            <div className="flex justify-between">
              <span>VAPID 키:</span>
              <span>{testState.vapidPublicKey ? "설정됨" : "미설정"}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Worker:</span>
              <span>{"serviceWorker" in navigator ? "지원" : "미지원"}</span>
            </div>
            <div className="flex justify-between">
              <span>Push Manager:</span>
              <span>{"PushManager" in window ? "지원" : "미지원"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
