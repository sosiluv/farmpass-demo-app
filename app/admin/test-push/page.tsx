"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccessDenied } from "@/components/error/access-denied";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useFarmsStore } from "@/store/use-farms-store";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/api-client";
import {
  Bell,
  Send,
  Users,
  AlertTriangle,
  Wrench,
  Megaphone,
  TestTube,
  Settings,
  User,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  Shield,
} from "lucide-react";

interface TestResult {
  id: string;
  type: string;
  status: "pending" | "success" | "error";
  message: string;
  timestamp: Date;
  details?: any;
}

interface NotificationTestForm {
  title: string;
  message: string;
  notificationType: "visitor" | "notice" | "emergency" | "maintenance";
  url: string;
  requireInteraction: boolean;
  icon?: string;
  badge?: string;
}

export default function PushNotificationTestPage() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const profile = state.status === "authenticated" ? state.profile : null;
  const { farms, fetchFarms } = useFarmsStore();
  const { showInfo, showWarning, showSuccess, showError } = useCommonToast();

  // 관리자 권한 체크
  if (!profile || profile.account_type !== "admin") {
    return (
      <AccessDenied
        title="관리자 전용"
        description="이 페이지는 관리자만 접근할 수 있습니다."
        showNavigation={true}
      />
    );
  }

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [vapidKey, setVapidKey] = useState<string>("");

  // 테스트 폼 상태
  const [testForm, setTestForm] = useState<NotificationTestForm>({
    title: "",
    message: "",
    notificationType: "notice",
    url: "/admin/dashboard",
    requireInteraction: false,
  });

  // 방문자 등록 테스트 폼 상태
  const [visitorTestForm, setVisitorTestForm] = useState({
    farmId: "",
    visitorName: "홍길동",
    visitorPhone: "010-0000-0000",
    visitorPurpose: "견학",
  });

  // 미리 정의된 테스트 시나리오
  const predefinedTests = [
    {
      id: "notice-test",
      name: "공지사항 알림 테스트",
      description: "일반 공지사항 브로드캐스트",
      data: {
        title: "시스템 업데이트 안내",
        message: "새로운 기능이 추가되었습니다!",
        notificationType: "notice" as const,
        targetType: "all" as const,
        url: "/admin/dashboard",
      },
    },
    {
      id: "emergency-test",
      name: "긴급 알림 테스트",
      description: "긴급 상황 알림 브로드캐스트",
      data: {
        title: "긴급 보안 알림",
        message: "시스템 보안 이벤트가 감지되었습니다.",
        notificationType: "emergency" as const,
        targetType: "all" as const,
        url: "/admin/settings/security",
        requireInteraction: true,
      },
    },
    {
      id: "maintenance-test",
      name: "유지보수 알림 테스트",
      description: "시스템 점검 안내",
      data: {
        title: "시스템 점검 안내",
        message: "오늘 밤 12시부터 2시간 동안 시스템 점검이 진행됩니다.",
        notificationType: "maintenance" as const,
        targetType: "all" as const,
        url: "/admin/maintenance",
      },
    },
  ];

  useEffect(() => {
    if (user?.id) {
      fetchFarms(user.id);
      checkSubscriptionStatus();
      getVapidKey();
    }
  }, [user?.id]);

  const addTestResult = (result: Omit<TestResult, "id" | "timestamp">) => {
    const newResult: TestResult = {
      ...result,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setTestResults((prev) => [newResult, ...prev]);
  };

  const checkSubscriptionStatus = async () => {
    try {
      const data = await apiClient("/api/push/subscription", {
        context: "푸시 구독 상태 확인",
        onError: (error) => {
          addTestResult({
            type: "구독 상태 확인",
            status: "error",
            message: "구독 상태 확인 실패",
            details: error,
          });
        },
      });
      setSubscriptionStatus(data);

      addTestResult({
        type: "구독 상태 확인",
        status: "success",
        message: `구독 수: ${data.subscriptions?.length || 0}개`,
        details: data,
      });
    } catch (error) {
      addTestResult({
        type: "구독 상태 확인",
        status: "error",
        message: "구독 상태 확인 실패",
        details: error,
      });
    }
  };

  const getVapidKey = async () => {
    try {
      const data = await apiClient("/api/push/vapid", {
        context: "VAPID 키 조회",
        onError: (error) => {
          addTestResult({
            type: "VAPID 키 확인",
            status: "error",
            message: "VAPID 키 조회 실패",
            details: error,
          });
        },
      });
      setVapidKey(data.publicKey || "");

      addTestResult({
        type: "VAPID 키 확인",
        status: "success",
        message: "VAPID 키 조회 성공",
        details: { keyLength: data.publicKey?.length },
      });
    } catch (error) {
      addTestResult({
        type: "VAPID 키 확인",
        status: "error",
        message: "VAPID 키 조회 실패",
        details: error,
      });
    }
  };

  const testNotificationPermission = async () => {
    showInfo("알림 권한 확인", "브라우저 알림 권한을 확인하는 중입니다...");
    addTestResult({
      type: "권한 테스트",
      status: "pending",
      message: "브라우저 알림 권한 확인 중...",
    });

    try {
      if (!("Notification" in window)) {
        showWarning(
          "브라우저 미지원",
          "이 브라우저는 알림을 지원하지 않습니다."
        );
        throw new Error("이 브라우저는 알림을 지원하지 않습니다.");
      }

      const permission = Notification.permission;

      addTestResult({
        type: "권한 테스트",
        status: permission === "granted" ? "success" : "error",
        message: `알림 권한: ${permission}`,
        details: { permission },
      });

      if (permission === "default") {
        const newPermission = await Notification.requestPermission();
        addTestResult({
          type: "권한 요청",
          status: newPermission === "granted" ? "success" : "error",
          message: `권한 요청 결과: ${newPermission}`,
          details: { newPermission },
        });
      }
    } catch (error) {
      addTestResult({
        type: "권한 테스트",
        status: "error",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
        details: error,
      });
    }
  };

  const testServiceWorker = async () => {
    addTestResult({
      type: "Service Worker 테스트",
      status: "pending",
      message: "Service Worker 상태 확인 중...",
    });

    try {
      if (!("serviceWorker" in navigator)) {
        throw new Error("이 브라우저는 Service Worker를 지원하지 않습니다.");
      }

      const registration = await navigator.serviceWorker.ready;

      addTestResult({
        type: "Service Worker 테스트",
        status: "success",
        message: "Service Worker 활성화됨",
        details: {
          scope: registration.scope,
          active: !!registration.active,
        },
      });
    } catch (error) {
      addTestResult({
        type: "Service Worker 테스트",
        status: "error",
        message: error instanceof Error ? error.message : "Service Worker 오류",
        details: error,
      });
    }
  };

  const testPushSubscription = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      addTestResult({
        type: "푸시 구독 테스트",
        status: "error",
        message: "브라우저가 푸시 알림을 지원하지 않습니다.",
      });
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      addTestResult({
        type: "푸시 구독 테스트",
        status: "pending",
        message: "구독 정보를 서버에 등록 중...",
      });

      await apiClient("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
        context: "푸시 구독 생성",
        onError: (error) => {
          addTestResult({
            type: "푸시 구독 테스트",
            status: "error",
            message: error instanceof Error ? error.message : "구독 생성 실패",
            details: error,
          });
        },
      });

      addTestResult({
        type: "푸시 구독 테스트",
        status: "success",
        message: "푸시 구독 생성 및 등록 성공",
        details: { endpoint: subscription.endpoint },
      });

      // 구독 상태 다시 확인
      await checkSubscriptionStatus();
    } catch (error) {
      addTestResult({
        type: "푸시 구독 테스트",
        status: "error",
        message: error instanceof Error ? error.message : "구독 생성 실패",
        details: error,
      });
    }
  };

  const sendCustomNotification = async () => {
    if (!testForm.title || !testForm.message) {
      showError("알림 작업 실패", "푸시 알림 작업에 실패했습니다.");
      return;
    }

    setIsLoading(true);
    addTestResult({
      type: "커스텀 알림 발송",
      status: "pending",
      message: `${testForm.notificationType} 알림 발송 중...`,
    });

    try {
      const payload = {
        title: testForm.title,
        message: testForm.message,
        notificationType: testForm.notificationType,
        url: testForm.url,
        requireInteraction: testForm.requireInteraction,
      };

      devLog.log("커스텀 알림 발송 페이로드:", payload);

      const result = await apiClient("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        context: "커스텀 푸시 알림 발송",
        onError: (error) => {
          addTestResult({
            type: "커스텀 알림 발송",
            status: "error",
            message: error instanceof Error ? error.message : "발송 실패",
            details: error,
          });
          showError(
            "테스트 알림 발송 실패",
            "테스트 알림 발송에 실패했습니다."
          );
        },
      });

      addTestResult({
        type: "커스텀 알림 발송",
        status: "success",
        message: `알림 발송 성공: ${result.sentCount}명`,
        details: {
          ...result,
          sentPayload: payload,
        },
      });

      // 실패가 있는 경우 경고
      if (result.failureCount > 0) {
        showWarning(
          "일부 발송 실패",
          `${result.sentCount}명에게 발송 성공, ${result.failureCount}명에게 발송 실패`
        );
      }

      showSuccess(
        "테스트 알림 발송 완료",
        "테스트 알림이 성공적으로 발송되었습니다."
      );
    } catch (error) {
      addTestResult({
        type: "커스텀 알림 발송",
        status: "error",
        message: error instanceof Error ? error.message : "발송 실패",
        details: error,
      });
      showError("테스트 알림 발송 실패", "테스트 알림 발송에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 실제 방문자 등록을 통한 알림 테스트
  const runVisitorFormTest = async () => {
    if (!visitorTestForm.farmId) {
      showError(
        "농장 목록 조회 실패",
        "농장 목록을 불러오는 중 오류가 발생했습니다."
      );
      return;
    }

    setIsLoading(true);
    addTestResult({
      type: "방문자 폼 등록 테스트",
      status: "pending",
      message: "실제 방문자 등록을 통한 알림 테스트 진행 중...",
    });

    try {
      // 방문자 등록 API가 기대하는 데이터 구조로 변환
      const visitorData = {
        fullName: visitorTestForm.visitorName,
        phoneNumber: visitorTestForm.visitorPhone,
        address: "테스트 주소",
        detailedAddress: "테스트 상세주소",
        carPlateNumber: "테스트123",
        visitPurpose: visitorTestForm.visitorPurpose,
        disinfectionCheck: true,
        notes: "푸시 알림 테스트용 방문자 데이터",
        consentGiven: true,
        dataRetentionDays: 30,
      };

      const result = await apiClient(
        `/api/farms/${visitorTestForm.farmId}/visitors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(visitorData),
          context: "방문자 등록 테스트",
          onError: (error) => {
            addTestResult({
              type: "방문자 폼 등록 테스트",
              status: "error",
              message:
                error instanceof Error ? error.message : "방문자 등록 실패",
              details: error,
            });
            showError(
              "방문자 등록 실패",
              "방문자를 등록하는 중 오류가 발생했습니다."
            );
          },
        }
      );

      addTestResult({
        type: "방문자 폼 등록 테스트",
        status: "success",
        message: `방문자 등록 성공! 농장 멤버들에게 알림 발송됨`,
        details: {
          visitorId: result.visitor?.id,
          farmId: visitorTestForm.farmId,
          notificationSent: true,
          visitorData: {
            name: visitorTestForm.visitorName,
            phone: visitorTestForm.visitorPhone,
            purpose: visitorTestForm.visitorPurpose,
            company: "테스트 회사",
            registeredAt: new Date().toISOString(),
          },
        },
      });
      showSuccess("방문자 등록 완료", "방문자가 성공적으로 등록되었습니다.");
    } catch (error) {
      devLog.error(error);
      addTestResult({
        type: "방문자 폼 등록 테스트",
        status: "error",
        message: error instanceof Error ? error.message : "방문자 등록 실패",
        details: error,
      });
      showError(
        "방문자 등록 실패",
        "방문자를 등록하는 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickTest = async (type: string, title: string, message: string) => {
    setIsLoading(true);
    addTestResult({
      type: `${type} 테스트`,
      status: "pending",
      message: `${type} 알림 발송 중...`,
    });

    try {
      // 브로드캐스트용 파라미터 (farmId 없음 = 전체 구독자)
      const payload = {
        title,
        message,
        notificationType: type,
        url: "/admin/dashboard",
        // farmId 없음 = 브로드캐스트
      };

      devLog.log(`${type} 테스트 페이로드:`, payload);

      const result = await apiClient("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        context: `${type} 푸시 알림 테스트`,
        onError: (error) => {
          addTestResult({
            type: `${type} 테스트`,
            status: "error",
            message: error instanceof Error ? error.message : "테스트 실패",
            details: error,
          });
        },
      });

      addTestResult({
        type: `${type} 테스트`,
        status: "success",
        message: `테스트 성공: ${result.sentCount}명에게 발송`,
        details: { ...result, sentPayload: payload },
      });
    } catch (error) {
      addTestResult({
        type: `${type} 테스트`,
        status: "error",
        message: error instanceof Error ? error.message : "테스트 실패",
        details: error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runPredefinedTest = async (test: (typeof predefinedTests)[0]) => {
    setIsLoading(true);
    addTestResult({
      type: test.name,
      status: "pending",
      message: `${test.description} 실행 중...`,
    });

    try {
      // 미리 정의된 테스트는 항상 브로드캐스트 (전체 대상)
      const payload = {
        ...test.data,
        // farmId 없음 = 브로드캐스트
      };

      devLog.log(`${test.name} 테스트 페이로드:`, payload);

      const result = await apiClient("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        context: `${test.name} 테스트`,
        onError: (error) => {
          addTestResult({
            type: test.name,
            status: "error",
            message: error instanceof Error ? error.message : "테스트 실패",
            details: error,
          });
        },
      });

      addTestResult({
        type: test.name,
        status: "success",
        message: `테스트 성공: ${result.sentCount}명에게 발송`,
        details: { ...result, sentPayload: payload },
      });
    } catch (error) {
      addTestResult({
        type: test.name,
        status: "error",
        message: error instanceof Error ? error.message : "테스트 실패",
        details: error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // 개발 환경 접근 제한
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center max-w-lg mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              개발 환경 전용
            </h1>
            <p className="text-slate-500">
              이 페이지는 개발 환경에서만 접근할 수 있습니다.
              <br />
              프로덕션 환경에서는 보안상 비활성화되어 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-3 md:p-6 pt-2 md:pt-4">
      <PageHeader
        title="푸시 알림 테스트"
        description="푸시 알림 시스템의 모든 기능을 테스트할 수 있습니다"
        breadcrumbs={[{ label: "관리자" }, { label: "푸시 알림 테스트" }]}
      />

      <Tabs defaultValue="quick-tests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quick-tests">빠른 테스트</TabsTrigger>
          <TabsTrigger value="custom-test">커스텀 테스트</TabsTrigger>
          <TabsTrigger value="system-check">시스템 점검</TabsTrigger>
          <TabsTrigger value="results">테스트 결과</TabsTrigger>
        </TabsList>

        {/* 빠른 테스트 */}
        <TabsContent value="quick-tests" className="space-y-4">
          {/* 방문자 폼 등록 테스트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                방문자 폼 등록 테스트 (실제 프로세스)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                실제 방문자 등록 프로세스를 통해 해당 농장 멤버들에게만 알림이
                발송되는지 테스트합니다.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>테스트할 농장 선택</Label>
                  <Select
                    value={visitorTestForm.farmId}
                    onValueChange={(value) =>
                      setVisitorTestForm((prev) => ({ ...prev, farmId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="농장을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {farms.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id}>
                          {farm.farm_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>방문자 이름</Label>
                  <Input
                    value={visitorTestForm.visitorName}
                    onChange={(e) =>
                      setVisitorTestForm((prev) => ({
                        ...prev,
                        visitorName: e.target.value,
                      }))
                    }
                    placeholder="테스트 방문자 이름"
                  />
                </div>
                <div className="space-y-2">
                  <Label>방문 목적</Label>
                  <Select
                    value={visitorTestForm.visitorPurpose}
                    onValueChange={(value) =>
                      setVisitorTestForm((prev) => ({
                        ...prev,
                        visitorPurpose: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="견학">견학</SelectItem>
                      <SelectItem value="업무">업무</SelectItem>
                      <SelectItem value="배송">배송</SelectItem>
                      <SelectItem value="점검">점검</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>연락처</Label>
                  <Input
                    value={visitorTestForm.visitorPhone}
                    onChange={(e) =>
                      setVisitorTestForm((prev) => ({
                        ...prev,
                        visitorPhone: e.target.value,
                      }))
                    }
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  이 테스트는 실제 방문자 데이터를 생성하며, 선택한 농장의 모든
                  멤버들에게 푸시 알림이 발송됩니다. 테스트 데이터는 `is_test:
                  true` 플래그로 표시됩니다.
                </AlertDescription>
              </Alert>

              <Button
                onClick={runVisitorFormTest}
                disabled={isLoading || !visitorTestForm.farmId}
                className="w-full"
                variant="default"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="mr-2 h-4 w-4" />
                )}
                방문자 등록 테스트 (실제 프로세스)
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  방문자 알림 테스트 (직접 발송)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  방문자 알림을 직접 발송하여 테스트합니다.
                </p>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>제목:</strong> 새로운 방문자 등록
                  </p>
                  <p className="text-sm">
                    <strong>메시지:</strong> 홍길동님이 테스트농장을
                    방문하였습니다.
                  </p>
                  <Badge variant="outline">visitor</Badge>
                </div>
                <Button
                  onClick={() =>
                    runQuickTest(
                      "visitor",
                      "새로운 방문자 등록",
                      "홍길동님이 테스트농장을 방문하였습니다."
                    )
                  }
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="mr-2 h-4 w-4" />
                  )}
                  테스트 실행
                </Button>
              </CardContent>
            </Card>

            {predefinedTests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {test.data.notificationType === "notice" && (
                      <Megaphone className="h-4 w-4" />
                    )}
                    {test.data.notificationType === "emergency" && (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {test.data.notificationType === "maintenance" && (
                      <Wrench className="h-4 w-4" />
                    )}
                    {test.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {test.description}
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>제목:</strong> {test.data.title}
                    </p>
                    <p className="text-sm">
                      <strong>메시지:</strong> {test.data.message}
                    </p>
                    <Badge variant="outline">
                      {test.data.notificationType}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => runPredefinedTest(test)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="mr-2 h-4 w-4" />
                    )}
                    테스트 실행
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 커스텀 테스트 */}
        <TabsContent value="custom-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>커스텀 알림 테스트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">제목</Label>
                  <Input
                    id="title"
                    value={testForm.title}
                    onChange={(e) =>
                      setTestForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="알림 제목"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notificationType">알림 유형</Label>
                  <Select
                    value={testForm.notificationType}
                    onValueChange={(value: any) =>
                      setTestForm((prev) => ({
                        ...prev,
                        notificationType: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visitor">방문자 알림</SelectItem>
                      <SelectItem value="notice">공지사항</SelectItem>
                      <SelectItem value="emergency">긴급 알림</SelectItem>
                      <SelectItem value="maintenance">유지보수</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">메시지</Label>
                <Textarea
                  id="message"
                  value={testForm.message}
                  onChange={(e) =>
                    setTestForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder="알림 메시지"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="url">이동 URL</Label>
                  <Input
                    id="url"
                    value={testForm.url}
                    onChange={(e) =>
                      setTestForm((prev) => ({ ...prev, url: e.target.value }))
                    }
                    placeholder="/admin/dashboard"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>사용자 상호작용 필요</Label>
                  <div className="text-sm text-muted-foreground">
                    사용자가 직접 닫아야 하는 알림
                  </div>
                </div>
                <Switch
                  checked={testForm.requireInteraction}
                  onCheckedChange={(checked) =>
                    setTestForm((prev) => ({
                      ...prev,
                      requireInteraction: checked,
                    }))
                  }
                />
              </div>

              <Button
                onClick={sendCustomNotification}
                disabled={isLoading || !testForm.title || !testForm.message}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                커스텀 알림 발송
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시스템 점검 */}
        <TabsContent value="system-check" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>기본 시스템 점검</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={testNotificationPermission} className="w-full">
                  <Bell className="mr-2 h-4 w-4" />
                  알림 권한 확인
                </Button>
                <Button onClick={testServiceWorker} className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Service Worker 확인
                </Button>
                <Button onClick={getVapidKey} className="w-full">
                  <TestTube className="mr-2 h-4 w-4" />
                  VAPID 키 확인
                </Button>
                <Button onClick={testPushSubscription} className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  푸시 구독 테스트
                </Button>
                <Button onClick={checkSubscriptionStatus} className="w-full">
                  <Info className="mr-2 h-4 w-4" />
                  구독 상태 확인
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>현재 상태</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>알림 권한:</span>
                    <Badge
                      variant={
                        typeof window !== "undefined" &&
                        "Notification" in window
                          ? Notification.permission === "granted"
                            ? "default"
                            : "destructive"
                          : "secondary"
                      }
                    >
                      {typeof window !== "undefined" && "Notification" in window
                        ? Notification.permission
                        : "미지원"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Worker:</span>
                    <Badge
                      variant={
                        typeof navigator !== "undefined" &&
                        "serviceWorker" in navigator
                          ? "default"
                          : "destructive"
                      }
                    >
                      {typeof navigator !== "undefined" &&
                      "serviceWorker" in navigator
                        ? "지원됨"
                        : "미지원"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>VAPID 키:</span>
                    <Badge variant={vapidKey ? "default" : "destructive"}>
                      {vapidKey ? "설정됨" : "없음"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>구독 수:</span>
                    <Badge variant="outline">
                      {subscriptionStatus?.subscriptions?.length || 0}개
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>농장 수:</span>
                    <Badge variant="outline">{farms.length}개</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 테스트 결과 */}
        <TabsContent value="results" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              테스트 결과 ({testResults.length})
            </h3>
            <Button onClick={clearTestResults} variant="outline" size="sm">
              결과 지우기
            </Button>
          </div>

          <div className="space-y-2">
            {testResults.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  아직 테스트 결과가 없습니다. 다른 탭에서 테스트를
                  실행해보세요.
                </AlertDescription>
              </Alert>
            ) : (
              testResults.map((result) => (
                <Card key={result.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {result.status === "success" && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {result.status === "error" && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {result.status === "pending" && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                          <span className="font-medium">{result.type}</span>
                          <Badge
                            variant={
                              result.status === "success"
                                ? "default"
                                : result.status === "error"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {result.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.message}
                        </p>
                        {result.details && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground">
                              상세 정보
                            </summary>
                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
