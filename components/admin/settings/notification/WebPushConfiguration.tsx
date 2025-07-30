"use client";

import React from "react";
import type { SystemSettings } from "@/lib/types/settings";
import { useSystemNotificationSettings } from "@/hooks/settings/useNotificationSettings";
import {
  VapidKeySection,
  NotificationIconSection,
  NotificationBehaviorSection,
} from "./index";

interface WebPushConfigurationProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  isLoading: boolean;
}

const WebPushConfiguration = React.memo(function WebPushConfiguration({
  settings,
  onUpdate,
  isLoading,
}: WebPushConfigurationProps) {
  const { handleGenerateVapidKeys } = useSystemNotificationSettings({
    settings,
    onUpdate,
    isLoading,
  });

  return (
    <div className="space-y-6">
      <VapidKeySection
        settings={settings}
        onUpdate={onUpdate}
        onGenerateKeys={handleGenerateVapidKeys}
        isLoading={isLoading}
      />

      <NotificationIconSection
        settings={settings}
        onUpdate={onUpdate}
        loading={isLoading}
      />

      <NotificationBehaviorSection settings={settings} onUpdate={onUpdate} />
    </div>
  );
});

export default WebPushConfiguration;
