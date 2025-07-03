import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Key, AlertTriangle, Copy, Check } from "lucide-react";
import type { SystemSettings } from "@/lib/types/settings";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import SettingsCardHeader from "../SettingsCardHeader";

interface VapidKeySectionProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  onGenerateKeys: () => void;
  isLoading: boolean;
}

const VapidKeySection = React.memo(function VapidKeySection({
  settings,
  onUpdate,
  onGenerateKeys,
  isLoading,
}: VapidKeySectionProps) {
  const { showCustomSuccess, showCustomError } = useCommonToast();
  const [copiedKey, setCopiedKey] = React.useState<"public" | "private" | null>(
    null
  );

  const handleCopyKey = async (keyType: "public" | "private") => {
    const keyValue =
      keyType === "public" ? settings.vapidPublicKey : settings.vapidPrivateKey;

    if (!keyValue) {
      showCustomError("키 복사 실패", "먼저 VAPID 키를 생성해주세요.");
      return;
    }

    try {
      await navigator.clipboard.writeText(keyValue);
      setCopiedKey(keyType);
      showCustomSuccess(
        "키 복사 완료",
        `${
          keyType === "public" ? "공개" : "비공개"
        } 키가 클립보드에 복사되었습니다.`
      );

      // 2초 후 복사 상태 초기화
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      showCustomError(
        "키 복사 실패",
        "키 복사에 실패했습니다. 다시 시도해주세요."
      );
    }
  };

  return (
    <Card>
      <SettingsCardHeader
        icon={Key}
        title="VAPID 키 설정"
        description="웹푸시 알림을 위한 VAPID (Voluntary Application Server Identification) 키를 설정합니다."
      />
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="vapidPublicKey">공개 키 (Public Key)</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="vapidPublicKey"
                placeholder="VAPID 키를 생성해주세요"
                value={settings.vapidPublicKey || ""}
                readOnly
                disabled
                className="pr-10 bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                onClick={() => handleCopyKey("public")}
                disabled={!settings.vapidPublicKey}
              >
                {copiedKey === "public" ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={onGenerateKeys}
              disabled={isLoading}
            >
              생성
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="vapidPrivateKey">비공개 키 (Private Key)</Label>
          <div className="relative">
            <Input
              id="vapidPrivateKey"
              type="text"
              placeholder="VAPID 키를 생성해주세요"
              value={settings.vapidPrivateKey || ""}
              readOnly
              disabled
              className="pr-10 bg-muted/50 text-muted-foreground cursor-not-allowed font-mono"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
              onClick={() => handleCopyKey("private")}
              disabled={!settings.vapidPrivateKey}
            >
              {copiedKey === "private" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>보안 주의사항</AlertTitle>
          <AlertDescription>
            비공개 키는 안전하게 보관하세요. 외부에 노출되면 보안상 위험할 수
            있습니다. 생성된 키는 복사 버튼을 통해 클립보드에 복사할 수
            있습니다.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
});

export default VapidKeySection;
