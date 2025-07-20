"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageSquare } from "lucide-react";
import {
  LABELS,
  PLACEHOLDERS,
  BROADCAST_NOTIFICATION_TYPE_OPTIONS,
  BUTTONS,
} from "@/lib/constants/settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BroadcastFormData {
  title: string;
  message: string;
  requireInteraction: boolean;
  url: string;
  notificationType: "maintenance" | "emergency" | "notice";
}

interface BroadcastFormProps {
  formData: BroadcastFormData;
  onInputChange: (
    field: keyof BroadcastFormData,
    value: string | boolean
  ) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isSending: boolean;
}

export function BroadcastForm({
  formData,
  onInputChange,
  onSubmit,
  isLoading,
  isSending,
}: BroadcastFormProps) {
  return (
    <div className="space-y-6">
      {/* 알림 유형 선택 */}
      <div className="space-y-2">
        <Label htmlFor="notification-type">
          {LABELS.BROADCAST_NOTIFICATION_TYPE}
        </Label>
        <Select
          value={formData.notificationType}
          onValueChange={(value) =>
            onInputChange(
              "notificationType",
              value as "maintenance" | "emergency" | "notice"
            )
          }
          disabled={isLoading || isSending}
        >
          <SelectTrigger id="notification-type" className="w-full">
            <SelectValue
              placeholder={PLACEHOLDERS.BROADCAST_NOTIFICATION_TYPE}
            />
          </SelectTrigger>
          <SelectContent>
            {BROADCAST_NOTIFICATION_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {LABELS.BROADCAST_NOTIFICATION_TYPE_DESC}
        </p>
      </div>

      {/* 제목 입력 */}
      <div className="space-y-2">
        <Label htmlFor="broadcast-title">{LABELS.BROADCAST_TITLE}</Label>
        <Input
          id="broadcast-title"
          placeholder={PLACEHOLDERS.BROADCAST_TITLE}
          value={formData.title}
          onChange={(e) => onInputChange("title", e.target.value)}
          maxLength={50}
          disabled={isLoading || isSending}
        />
        <div className="text-xs text-muted-foreground">
          {formData.title.length}/50자
        </div>
      </div>

      {/* 메시지 입력 */}
      <div className="space-y-2">
        <Label htmlFor="broadcast-message">{LABELS.BROADCAST_MESSAGE}</Label>
        <Textarea
          id="broadcast-message"
          placeholder={PLACEHOLDERS.BROADCAST_MESSAGE}
          value={formData.message}
          onChange={(e) => onInputChange("message", e.target.value)}
          maxLength={200}
          rows={4}
          disabled={isLoading || isSending}
        />
        <div className="text-xs text-muted-foreground">
          {formData.message.length}/200자
        </div>
      </div>

      {/* URL 설정 */}
      <div className="space-y-2">
        <Label htmlFor="broadcast-url">{LABELS.BROADCAST_URL}</Label>
        <Input
          id="broadcast-url"
          placeholder={PLACEHOLDERS.BROADCAST_URL}
          value={formData.url}
          onChange={(e) => onInputChange("url", e.target.value)}
          disabled={isLoading || isSending}
        />
      </div>

      {/* 상호작용 필요 설정 */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="require-interaction">
            {LABELS.BROADCAST_REQUIRE_INTERACTION}
          </Label>
          <div className="text-sm text-muted-foreground">
            {LABELS.BROADCAST_REQUIRE_INTERACTION_DESC}
          </div>
        </div>
        <Switch
          id="require-interaction"
          checked={formData.requireInteraction}
          onCheckedChange={(checked) =>
            onInputChange("requireInteraction", checked)
          }
          disabled={isLoading || isSending}
        />
      </div>

      {/* 발송 버튼 */}
      <div className="flex gap-2">
        <Button
          onClick={onSubmit}
          disabled={
            isLoading ||
            isSending ||
            !formData.title.trim() ||
            !formData.message.trim() ||
            !formData.notificationType
          }
          className="flex-1"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {BUTTONS.BROADCAST_SENDING}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {BUTTONS.BROADCAST_SEND_BUTTON}
            </>
          )}
        </Button>
      </div>

      {/* 도움말 */}
      <div className="rounded-lg border p-4">
        <div className="flex items-start gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">{LABELS.BROADCAST_GUIDE_TITLE}</p>
            <ul className="space-y-1 text-xs">
              <li>{LABELS.BROADCAST_GUIDE_NOTICE}</li>
              <li>{LABELS.BROADCAST_GUIDE_EMERGENCY}</li>
              <li>{LABELS.BROADCAST_GUIDE_MAINTENANCE}</li>
              <li>{LABELS.BROADCAST_GUIDE_TITLE_TIP}</li>
              <li>{LABELS.BROADCAST_GUIDE_REVIEW}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
