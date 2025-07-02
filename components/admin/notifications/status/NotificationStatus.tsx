import {
  Bell,
  BellOff,
  TestTube,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
  Zap,
  Activity,
  Building,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionStatus, Farm } from "@/lib/types/notification";

interface StatusProps {
  isLoading?: boolean;
  onAllow?: () => void;
  onDeny?: () => void;
  onTest?: () => void;
  onCleanup?: () => void;
  onUnsubscribe?: () => void;
  farms?: Farm[];
}

export const CheckingStatus = () => (
  <div className="flex items-center justify-center py-12">
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <div className="relative">
        <Clock className="h-6 w-6 animate-spin" />
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">푸시 알림 상태 확인 중</p>
        <p className="text-xs text-muted-foreground">잠시만 기다려주세요...</p>
      </div>
    </div>
  </div>
);

export const UnsupportedStatus = () => (
  <div className="text-center py-10">
    <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4 relative">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
        <span className="text-xs text-destructive-foreground">!</span>
      </div>
    </div>
    <h3 className="text-lg font-semibold mb-2">푸시 알림 미지원</h3>
    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
      현재 브라우저에서는 푸시 알림을 지원하지 않습니다.
      <br />
      Chrome, Firefox, Safari 최신 버전을 사용해주세요.
    </p>
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground">
      <Shield className="h-3 w-3" />
      보안상 HTTPS 환경에서만 지원됩니다
    </div>
  </div>
);

export const DeniedStatus = ({ onAllow }: StatusProps) => (
  <div className="text-center py-10">
    <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4 relative">
      <Shield className="h-8 w-8 text-destructive" />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
        <span className="text-xs text-destructive-foreground">×</span>
      </div>
    </div>
    <h3 className="text-lg font-semibold mb-2">알림 권한 필요</h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
      브라우저에서 알림 권한이 차단되었습니다.
      <br />
      주소창 옆의 🔒 아이콘을 클릭하여 권한을 허용해주세요.
    </p>
    <Button onClick={onAllow} variant="outline" className="min-w-40">
      <Shield className="mr-2 h-4 w-4" />
      권한 다시 확인하기
    </Button>
  </div>
);

export const GrantedStatus = ({ isLoading, onAllow }: StatusProps) => (
  <div className="space-y-6">
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 relative">
        <Bell className="h-8 w-8 text-primary" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="h-3 w-3 text-white" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">푸시 알림 준비 완료</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        브라우저 알림 권한이 허용되었습니다.
        <br />
        구독하시면 농장 관련 실시간 알림을 받을 수 있습니다.
      </p>

      <div className="space-y-3">
        <Button
          onClick={onAllow}
          disabled={isLoading}
          className="min-w-40 h-10"
        >
          {isLoading ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              구독 진행 중...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              푸시 알림 구독하기
            </>
          )}
        </Button>
      </div>
    </div>
  </div>
);

export const SubscribedStatus = ({
  farms,
  onTest,
  onCleanup,
  onUnsubscribe,
  isLoading,
}: StatusProps) => (
  <div className="space-y-4">
    {/* 구독 상태 헤더 - 모든 기기에서 일관된 레이아웃 */}
    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
      <div className="flex items-center gap-3 w-full lg:w-auto lg:flex-1">
        <div className="relative p-2 bg-primary/10 rounded-full">
          <Activity className="h-5 w-5 text-primary" />
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-primary">
            푸시 알림 활성화됨
          </p>
          <p className="text-sm text-muted-foreground">
            모든 농장의 실시간 알림을 수신하고 있습니다
          </p>
        </div>
      </div>
      {/* 버튼 그룹 - PC에서 오른쪽 정렬 및 여백 조정 */}
      <div className="flex gap-2 w-full lg:w-auto lg:ml-auto">
        {process.env.NODE_ENV === "development" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onTest}
            className="flex-1 lg:flex-initial h-10 px-4 hover:bg-primary/10"
            title="테스트 알림 발송"
          >
            <TestTube className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">테스트</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCleanup}
          disabled={isLoading}
          className="flex-1 lg:flex-initial h-10 px-4 text-muted-foreground hover:bg-blue/10 hover:text-blue-600"
          title="만료된 구독 정리"
        >
          <RefreshCw className="h-4 w-4 lg:mr-2" />
          <span className="hidden lg:inline">정리</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnsubscribe}
          disabled={isLoading}
          className="flex-1 lg:flex-initial h-10 px-4 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="구독 해제"
        >
          <BellOff className="h-4 w-4 lg:mr-2" />
          <span className="hidden lg:inline">해제</span>
        </Button>
      </div>
    </div>

    {/* 알림 수신 범위 안내 - 모든 기기에서 일관된 여백과 크기 */}
    <div className="p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-primary/10 rounded-full mt-0.5 shrink-0">
          <Bell className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="space-y-2 min-w-0">
          <h4 className="text-sm font-medium">알림 수신 범위</h4>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-primary rounded-full shrink-0" />
              <span className="truncate">모든 농장의 방문자 등록 알림</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-primary rounded-full shrink-0" />
              <span className="truncate">농장 관리 관련 중요 알림</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-primary rounded-full shrink-0" />
              <span className="truncate">시스템 공지사항 및 업데이트</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    {/* 농장 목록 정보 - 모든 태블릿에서 한 줄로 표시 */}
    {farms && farms.length > 0 && (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold flex items-center gap-2">
            <Building className="h-4 w-4" />
            관리 중인 농장
          </h4>
          <div className="text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full">
            {farms.length}개 농장
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="flex items-center justify-between p-4 rounded-xl border bg-primary/5 border-primary/30 gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {farm.farm_name}
                  </p>
                  {farm.address && (
                    <p className="text-xs text-muted-foreground truncate">
                      {farm.address}
                    </p>
                  )}
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs bg-primary/10 text-primary border-primary/30 whitespace-nowrap shrink-0"
              >
                알림 수신 중
              </Badge>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export const renderNotificationStatus = (
  status: SubscriptionStatus,
  props: StatusProps
) => {
  switch (status) {
    case "checking":
      return <CheckingStatus />;
    case "unsupported":
      return <UnsupportedStatus />;
    case "denied":
      return <DeniedStatus {...props} />;
    case "granted":
      return <GrantedStatus {...props} />;
    case "subscribed":
      return <SubscribedStatus {...props} />;
    default:
      return null;
  }
};
