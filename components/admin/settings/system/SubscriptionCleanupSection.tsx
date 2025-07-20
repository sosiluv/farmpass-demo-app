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
import { PAGE_HEADER } from "@/lib/constants/settings";

interface SubscriptionCleanupSectionProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  isLoading: boolean;
}

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
        title={PAGE_HEADER.SUBSCRIPTION_CLEANUP_SECTION_TITLE}
        description={PAGE_HEADER.SUBSCRIPTION_CLEANUP_SECTION_DESC}
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
