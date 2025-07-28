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
import { useCleanupSubscriptionsMutation } from "@/lib/hooks/query/use-push-mutations";
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
  const cleanupSubscriptionsMutation = useCleanupSubscriptionsMutation();

  const handleCleanupRequest = async (isTest: boolean = false) => {
    try {
      const options = {
        realTimeCheck: true,
        forceDelete: isTest ? false : settings.subscriptionForceDelete || false,
        failCountThreshold: settings.subscriptionFailCountThreshold || 5,
        cleanupInactive: settings.subscriptionCleanupInactive || true,
        deleteAfterDays: settings.subscriptionCleanupDays || 30,
      };

      await cleanupSubscriptionsMutation.mutateAsync(options);
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
        {cleanupSubscriptionsMutation.isSuccess &&
          cleanupSubscriptionsMutation.data && (
            <>
              <Separator />
              <SubscriptionCleanupSuccessMessage
                lastCleanupResult={cleanupSubscriptionsMutation.data as any}
              />
            </>
          )}
        <Separator />
        <SubscriptionCleanupActions
          settings={settings}
          isLoading={isLoading || cleanupSubscriptionsMutation.isPending}
          onCleanupRequest={handleCleanupRequest}
        />
      </CardContent>
    </Card>
  );
}
