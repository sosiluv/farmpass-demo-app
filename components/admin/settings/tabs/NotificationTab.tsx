"use client";

import React, { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bell, Eye } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import type { SystemSettings } from "@/lib/types/settings";
import { WebPushConfiguration } from "../notification";
import SettingsCardHeader from "../SettingsCardHeader";
import {
  previewVisitTemplate,
  validateVisitTemplate,
} from "@/lib/utils/notification/notification-template";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

interface NotificationTabProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  isLoading: boolean;
  handleImageUpload: (
    file: File,
    type: "notificationIcon" | "notificationBadge"
  ) => Promise<void>;
  handleImageDelete: (
    type: "notificationIcon" | "notificationBadge"
  ) => Promise<void>;
}

const NotificationTab = React.memo(function NotificationTab({
  settings,
  onUpdate,
  isLoading,
  handleImageUpload,
  handleImageDelete,
}: NotificationTabProps) {
  const { showInfo, showWarning, showSuccess, showError } = useCommonToast();

  // 이미지 업로드 핸들러 (토스트 처리 포함)
  const handleImageUploadWithToast = useCallback(
    async (file: File, type: "notificationIcon" | "notificationBadge") => {
      showInfo("이미지 업로드 시작", "이미지를 업로드하는 중입니다...");
      if (!file) {
        showWarning("입력 오류", "파일이 선택되지 않았습니다.");
        return;
      }
      try {
        await handleImageUpload(file, type);
        const typeName =
          type === "notificationIcon" ? "알림 아이콘" : "알림 배지";
        showSuccess(
          "이미지 업로드 완료",
          `${typeName}이 성공적으로 업로드되었습니다.`
        );
      } catch (error) {
        const typeName =
          type === "notificationIcon" ? "알림 아이콘" : "알림 배지";
        showError(
          "이미지 업로드 실패",
          `${typeName} 업로드 중 오류가 발생했습니다.`
        );
        throw error; // 에러를 다시 던져서 원래 핸들러에서도 처리할 수 있도록
      }
    },
    [handleImageUpload] // 토스트 함수들을 의존성에서 제거
  );

  // 이미지 삭제 핸들러 (토스트 처리 포함)
  const handleImageDeleteWithToast = useCallback(
    async (type: "notificationIcon" | "notificationBadge") => {
      try {
        await handleImageDelete(type);
        const typeName =
          type === "notificationIcon" ? "알림 아이콘" : "알림 배지";
        showSuccess(
          "이미지 삭제 완료",
          `${typeName}이 성공적으로 삭제되었습니다.`
        );
      } catch (error) {
        const typeName =
          type === "notificationIcon" ? "알림 아이콘" : "알림 배지";
        showError(
          "이미지 삭제 실패",
          `${typeName} 삭제 중 오류가 발생했습니다.`
        );
        throw error; // 에러를 다시 던져서 원래 핸들러에서도 처리할 수 있도록
      }
    },
    [handleImageDelete] // 토스트 함수들을 의존성에서 제거
  );

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
      showError(
        "템플릿 미리보기 실패",
        "템플릿 미리보기를 생성하는 중 오류가 발생했습니다."
      );
    }
  }, [settings.visitTemplate]); // 토스트 함수들을 의존성에서 제거

  return (
    <ErrorBoundary
      title="알림 설정 탭 오류"
      description="알림 설정을 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="space-y-6">
        {/* 방문 알림 템플릿 설정 */}
        <Card>
          <SettingsCardHeader
            icon={Bell}
            title="방문 알림 템플릿"
            description="새로운 방문자 등록 시 발송되는 알림 메시지 템플릿을 설정합니다."
          />
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="visitTemplate">알림 메시지 템플릿</Label>
              <Textarea
                id="visitTemplate"
                placeholder="새로운 방문자가 등록되었습니다. 방문자: {방문자명}, 농장: {농장명}, 시간: {방문시간}"
                value={settings.visitTemplate}
                onChange={(e) => onUpdate("visitTemplate", e.target.value)}
                rows={3}
              />
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    사용 가능한 변수: {"{방문자명}"}, {"{방문날짜}"},{" "}
                    {"{방문시간}"},{"{농장명}"}, {"{방문목적}"}, {"{연락처}"},{" "}
                    {"{차량번호}"}, {"{방역상태}"}, {"{등록시간}"}
                  </p>
                </div>
                <Button
                  onClick={handlePreviewTemplate}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  미리보기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 웹푸시 상세 설정 */}
        <WebPushConfiguration
          settings={settings}
          onUpdate={onUpdate}
          isLoading={isLoading}
          handleImageUpload={handleImageUploadWithToast}
          handleImageDelete={handleImageDeleteWithToast}
        />
      </div>
    </ErrorBoundary>
  );
});

export default NotificationTab;
