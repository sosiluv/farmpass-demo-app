import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";
import type { SystemSettings } from "@/lib/types/settings";
import SettingsCardHeader from "../SettingsCardHeader";
import {
  SubscriptionCleanupActions,
  SubscriptionCleanupForm,
  SubscriptionCleanupSuccessMessage,
} from "./subscription-cleanup";
import { useSubscriptionCleanupManager } from "@/lib/hooks/query/use-subscription-cleanup-manager";

interface SubscriptionCleanupSectionProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  isLoading: boolean;
}

const CLEANUP_DAYS_OPTIONS = [
  { label: "자동 삭제 안함", value: 0 },
  { label: "7일 후 삭제", value: 7 },
  { label: "15일 후 삭제", value: 15 },
  { label: "30일 후 삭제", value: 30 },
  { label: "60일 후 삭제", value: 60 },
  { label: "90일 후 삭제", value: 90 },
];

const FAIL_COUNT_OPTIONS = [
  { label: "3회 실패", value: 3 },
  { label: "5회 실패", value: 5 },
  { label: "10회 실패", value: 10 },
  { label: "15회 실패", value: 15 },
];

export function SubscriptionCleanupSection({
  settings,
  onUpdate,
  isLoading,
}: SubscriptionCleanupSectionProps) {
  const { cleanupLoading, lastCleanupSuccess, executeCleanup } =
    useSubscriptionCleanupManager();

  const handleCleanupRequest = async (isTest: boolean = false) => {
    try {
      const options = {
        realTimeCheck: false,
        forceDelete: isTest ? false : settings.subscriptionForceDelete || false,
        failCountThreshold: settings.subscriptionFailCountThreshold || 5,
        cleanupInactive: settings.subscriptionCleanupInactive || true,
        deleteAfterDays: settings.subscriptionCleanupDays || 30,
      };

      await executeCleanup(options);
    } catch (error) {
      console.error("구독 정리 실패:", error);
    }
  };

  return (
    <Card>
      <SettingsCardHeader
        icon={Settings}
        title="구독 정리 설정"
        description="푸시 구독 정리 정책을 관리합니다. 만료되거나 실패한 구독을 자동으로 정리합니다."
      />
      <CardContent className="space-y-6">
        <SubscriptionCleanupForm
          settings={settings}
          onUpdate={onUpdate}
          isLoading={isLoading}
        />
        {lastCleanupSuccess && (
          <>
            <Separator />
            <SubscriptionCleanupSuccessMessage
              lastCleanupResult={lastCleanupSuccess as any}
            />
          </>
        )}
        <Separator />
        <SubscriptionCleanupActions
          settings={settings}
          isLoading={isLoading || cleanupLoading}
          onCleanupRequest={handleCleanupRequest}
        />
      </CardContent>
    </Card>
  );
}
