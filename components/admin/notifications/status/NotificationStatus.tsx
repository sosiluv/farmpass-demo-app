import {
  Bell,
  BellOff,
  CheckCircle,
  AlertTriangle,
  Shield,
  Zap,
  Activity,
  Building,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LottieLoadingCompact } from "@/components/ui/lottie-loading";
import { BUTTONS, LABELS } from "@/lib/constants/notifications";
import type { Farm } from "@/lib/types";

// 알림 상태 표시용 Farm 타입 (최소한의 정보만 포함)
interface NotificationFarm extends Pick<Farm, "id" | "farm_name"> {
  address?: string;
  isSubscribed?: boolean;
}

interface StatusProps {
  isLoading?: boolean;
  onAllow?: () => void;
  onDeny?: () => void;
  onCleanup?: () => void;
  onUnsubscribe?: () => void;
  farms?: NotificationFarm[];
}

export const CheckingStatus = () => (
  <div className="flex items-center justify-center py-12">
    <LottieLoadingCompact text={LABELS.CHECKING_STATUS} size="md" />
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
    <h3 className="text-lg sm:text-xl font-semibold mb-2">
      {LABELS.UNSUPPORTED_TITLE}
    </h3>
    <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-sm mx-auto">
      {LABELS.UNSUPPORTED_DESCRIPTION}
      <br />
      <b>{LABELS.SUPPORTED_BROWSERS}</b>
      <br />• <b>{LABELS.CHROME}</b> (PC, Android)
      <br />• <b>{LABELS.EDGE}</b> (PC)
      <br />• <b>{LABELS.FIREFOX}</b> (PC, Android)
      <br />• <b>{LABELS.SAFARI}</b> ({LABELS.SAFARI_NOTE})
      <br />
      <span className="text-xs sm:text-sm text-muted-foreground">
        {LABELS.SAFARI_WARNING}
      </span>
    </p>
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs sm:text-sm text-muted-foreground">
      <Shield className="h-3 w-3" />
      {LABELS.SECURITY_NOTE}
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
    <h3 className="text-lg sm:text-xl font-semibold mb-2">
      {LABELS.PERMISSION_NEEDED}
    </h3>
    <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-sm mx-auto">
      {LABELS.PERMISSION_DENIED}
      <br />
      {LABELS.PERMISSION_INSTRUCTION}
    </p>
    <Button
      onClick={onAllow}
      variant="outline"
      className="text-sm sm:text-base"
    >
      <Shield className="mr-2 h-4 w-4" />
      {BUTTONS.CHECK_PERMISSION_AGAIN}
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
      <h3 className="text-lg sm:text-xl font-semibold mb-2">
        {LABELS.PUSH_READY}
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-sm mx-auto">
        {LABELS.PUSH_READY_DESC}
        <br />
        {LABELS.PUSH_SUBSCRIBE_DESC}
      </p>

      <div className="space-y-3">
        <Button
          onClick={onAllow}
          disabled={isLoading}
          className="text-sm sm:text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {BUTTONS.SUBSCRIBING}
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              {BUTTONS.SUBSCRIBE_PUSH}
            </>
          )}
        </Button>
      </div>
    </div>
  </div>
);

export const SubscribedStatus = ({
  farms,
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
        <div className="flex-1 space-y-2">
          <p className="text-sm sm:text-base font-semibold text-primary">
            {LABELS.PUSH_ACTIVE}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {LABELS.PUSH_ACTIVE_DESC}
          </p>
        </div>
      </div>
      {/* 버튼 그룹 - PC에서 오른쪽 정렬 및 여백 조정 */}
      <div className="flex gap-2 w-full lg:w-auto lg:ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCleanup}
          disabled={isLoading}
          className="flex-1 lg:flex-initial h-10 px-4 text-muted-foreground hover:bg-blue/10 hover:text-blue-600"
          title={BUTTONS.CLEANUP_TITLE}
        >
          <RefreshCw className="h-4 w-4 lg:mr-2" />
          <span className="hidden lg:inline">{BUTTONS.CLEANUP}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnsubscribe}
          disabled={isLoading}
          className="flex-1 lg:flex-initial h-10 px-4 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title={BUTTONS.UNSUBSCRIBE_TITLE}
        >
          <BellOff className="h-4 w-4 lg:mr-2" />
          <span className="hidden lg:inline">{BUTTONS.UNSUBSCRIBE}</span>
        </Button>
      </div>
    </div>

    {/* 알림 수신 범위 안내 - 모든 기기에서 일관된 여백과 크기 */}
    <div className="p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-primary/10 rounded-full mt-0.5 shrink-0">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-2 min-w-0">
          <h4 className="text-sm sm:text-base font-medium">
            {LABELS.NOTIFICATION_SCOPE}
          </h4>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-primary rounded-full shrink-0" />
              <span className="truncate">{LABELS.VISITOR_REGISTRATION}</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-primary rounded-full shrink-0" />
              <span className="truncate">{LABELS.FARM_MANAGEMENT}</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-primary rounded-full shrink-0" />
              <span className="truncate">{LABELS.SYSTEM_NOTICE}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    {/* 농장 목록 정보 - 모든 태블릿에서 한 줄로 표시 */}
    {farms && farms.length > 0 && (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Building className="h-4 w-4" />
            {LABELS.MANAGED_FARMS}
          </h4>
          <div className="text-xs sm:text-sm text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full">
            {LABELS.FARM_COUNT.replace("{count}", farms.length.toString())}
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
          {(farms || []).map((farm) => (
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
                  <p className="text-sm sm:text-base font-medium text-foreground truncate">
                    {farm.farm_name}
                  </p>
                  {farm.address && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {farm.address}
                    </p>
                  )}
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs sm:text-sm bg-primary/10 text-primary border-primary/30 whitespace-nowrap shrink-0"
              >
                {LABELS.NOTIFICATION_RECEIVING}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
