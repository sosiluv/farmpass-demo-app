import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SystemSettings } from "@/lib/types/settings";

interface SubscriptionCleanupFormProps {
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

export function SubscriptionCleanupForm({
  settings,
  onUpdate,
  isLoading,
}: SubscriptionCleanupFormProps) {
  return (
    <div className="space-y-6">
      {/* 삭제 일수 설정 */}
      <div className="space-y-2">
        <Label htmlFor="cleanupDays">자동 삭제 일수</Label>
        <Select
          value={settings.subscriptionCleanupDays?.toString() || "30"}
          onValueChange={(value) =>
            onUpdate("subscriptionCleanupDays", parseInt(value))
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="삭제 일수를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {CLEANUP_DAYS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Soft delete된 구독을 지정된 일수 후 완전히 삭제합니다. 0으로 설정하면
          자동 삭제하지 않습니다.
        </p>
      </div>

      {/* 실패 횟수 임계값 */}
      <div className="space-y-2">
        <Label htmlFor="failCountThreshold">실패 횟수 임계값</Label>
        <Select
          value={settings.subscriptionFailCountThreshold?.toString() || "5"}
          onValueChange={(value) =>
            onUpdate("subscriptionFailCountThreshold", parseInt(value))
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="실패 횟수 임계값을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {FAIL_COUNT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          푸시 발송 실패가 지정된 횟수를 초과하면 구독을 비활성화합니다.
        </p>
      </div>

      {/* 비활성 구독 정리 */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>비활성 구독 정리</Label>
          <p className="text-sm text-muted-foreground">
            비활성화된 구독을 자동으로 정리합니다.
          </p>
        </div>
        <Switch
          checked={settings.subscriptionCleanupInactive || false}
          onCheckedChange={(checked) =>
            onUpdate("subscriptionCleanupInactive", checked)
          }
          disabled={isLoading}
        />
      </div>

      {/* 강제 삭제 */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>강제 삭제</Label>
          <p className="text-sm text-muted-foreground">
            Soft delete 대신 즉시 완전 삭제합니다. (주의: 복구 불가능)
          </p>
        </div>
        <Switch
          checked={settings.subscriptionForceDelete || false}
          onCheckedChange={(checked) =>
            onUpdate("subscriptionForceDelete", checked)
          }
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
