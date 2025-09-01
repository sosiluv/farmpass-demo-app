"use client";

import React, { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bell, Eye } from "lucide-react";
import {
  BUTTONS,
  LABELS,
  PLACEHOLDERS,
  PAGE_HEADER,
} from "@/lib/constants/settings";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import type { SystemSettings } from "@/lib/types/settings";
import {
  VapidKeySection,
  NotificationIconSection,
  NotificationBehaviorSection,
} from "../notification";
import SettingsCardHeader from "../SettingsCardHeader";
import {
  previewVisitTemplate,
  validateVisitTemplate,
} from "@/lib/utils/notification/notification-template";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { handleError } from "@/lib/utils/error";
import { useSystemNotificationSettings } from "@/hooks/settings/useNotificationSettings";

interface NotificationTabProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  isLoading: boolean;
}

const NotificationTab = React.memo(function NotificationTab({
  settings,
  onUpdate,
  isLoading,
}: NotificationTabProps) {
  const { showError, showSuccess } = useCommonToast();
  const { handleGenerateVapidKeys } = useSystemNotificationSettings({
    settings,
    onUpdate,
    isLoading,
  });

  // 템플릿 미리보기 함수
  const handlePreviewTemplate = useCallback(() => {
    try {
      // 템플릿 유효성 검사
      const validation = validateVisitTemplate(settings.visitTemplate);

      if (!validation.isValid) {
        showError(
          "템플릿 미리보기 실패",
          `지원되지 않는 변수가 있습니다: ${validation.unsupportedVariables.join(
            ", "
          )}`
        );
        return;
      }

      // 미리보기 생성
      const previewText = previewVisitTemplate(settings.visitTemplate);

      showSuccess("템플릿 미리보기 완료", previewText);
    } catch (error) {
      handleError(error, "템플릿 미리보기");
      showError(
        "템플릿 미리보기 실패",
        "템플릿 미리보기를 생성하는 중 오류가 발생했습니다."
      );
    }
  }, [settings.visitTemplate, showError, showSuccess]);

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="space-y-6">
        {/* 방문 알림 템플릿 설정 */}
        <Card>
          <SettingsCardHeader
            icon={Bell}
            title={PAGE_HEADER.VISIT_NOTIFICATION_TEMPLATE_TITLE}
            description={PAGE_HEADER.VISIT_NOTIFICATION_TEMPLATE_DESC}
          />
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label
                htmlFor="visitTemplate"
                className="text-sm sm:text-base font-medium"
              >
                {LABELS.VISIT_NOTIFICATION_TEMPLATE_LABEL}
              </Label>
              <Textarea
                id="visitTemplate"
                placeholder={PLACEHOLDERS.VISIT_NOTIFICATION_TEMPLATE}
                value={settings.visitTemplate}
                onChange={(e) => onUpdate("visitTemplate", e.target.value)}
                rows={3}
              />
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {LABELS.VISIT_NOTIFICATION_TEMPLATE_VARIABLES}
                  </p>
                </div>
                <Button
                  onClick={handlePreviewTemplate}
                  variant="outline"
                  className="flex items-center gap-1 text-sm sm:text-base"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {BUTTONS.TEMPLATE_PREVIEW_BUTTON}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 웹푸시 상세 설정 */}

        <NotificationBehaviorSection settings={settings} onUpdate={onUpdate} />

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
      </div>
    </ErrorBoundary>
  );
});

export default NotificationTab;
