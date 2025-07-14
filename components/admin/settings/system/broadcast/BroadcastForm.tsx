"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageSquare } from "lucide-react";
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

const NOTIFICATION_TYPES = [
  { value: "notice", label: "공지사항" },
  { value: "emergency", label: "긴급 알림" },
  { value: "maintenance", label: "유지보수 알림" },
] as const;

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
        <Label htmlFor="notification-type">알림 유형</Label>
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
            <SelectValue placeholder="알림 유형을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {(NOTIFICATION_TYPES || []).map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          선택한 알림 유형에 따라 해당 알림을 구독한 사용자에게만 전송됩니다.
        </p>
      </div>

      {/* 제목 입력 */}
      <div className="space-y-2">
        <Label htmlFor="broadcast-title">알림 제목</Label>
        <Input
          id="broadcast-title"
          placeholder="예: 시스템 점검 안내"
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
        <Label htmlFor="broadcast-message">알림 내용</Label>
        <Textarea
          id="broadcast-message"
          placeholder="예: 오늘 밤 12시부터 새벽 2시까지 시스템 점검이 진행됩니다."
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
        <Label htmlFor="broadcast-url">알림 클릭 시 이동할 URL</Label>
        <Input
          id="broadcast-url"
          placeholder="/admin/dashboard"
          value={formData.url}
          onChange={(e) => onInputChange("url", e.target.value)}
          disabled={isLoading || isSending}
        />
      </div>

      {/* 상호작용 필요 설정 */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="require-interaction">사용자 상호작용 필요</Label>
          <div className="text-sm text-muted-foreground">
            활성화하면 사용자가 직접 알림을 닫아야 합니다.
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
              발송 중...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              브로드캐스트 발송
            </>
          )}
        </Button>
      </div>

      {/* 도움말 */}
      <div className="rounded-lg border p-4">
        <div className="flex items-start gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">브로드캐스트 사용 가이드:</p>
            <ul className="space-y-1 text-xs">
              <li>• 공지사항: 일반적인 공지나 안내사항에 사용</li>
              <li>• 긴급 알림: 중요하고 긴급한 상황 전파에 사용</li>
              <li>• 유지보수 알림: 시스템 점검이나 업데이트 안내에 사용</li>
              <li>• 제목은 간결하고 명확하게 작성해주세요</li>
              <li>• 발송 전 내용을 다시 한 번 확인해주세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
