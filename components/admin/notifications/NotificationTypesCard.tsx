import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { NotificationSettings } from "@/lib/types/notification";
import NotificationCardHeader from "./NotificationCardHeader";
import { useNotificationSettingsStore } from "@/store/use-notification-settings-store";
import { Bell, AlertTriangle, Wrench, Megaphone } from "lucide-react";

const NOTIFICATION_TYPES = [
  {
    key: "visitor_alerts",
    icon: <Bell className="h-4 w-4" />,
    label: "방문자 알림",
    description: "새로운 방문자가 등록되면 알림을 받습니다.",
    iconColor: "bg-blue-100 text-blue-600",
  },
  {
    key: "notice_alerts",
    icon: <Megaphone className="h-4 w-4" />,
    label: "공지사항 알림",
    description: "새로운 공지사항이 등록되면 알림을 받습니다.",
    iconColor: "bg-purple-100 text-purple-600",
  },
  {
    key: "emergency_alerts",
    icon: <AlertTriangle className="h-4 w-4" />,
    label: "긴급 알림",
    description: "긴급 상황 발생 시 알림을 받습니다.",
    iconColor: "bg-red-100 text-red-600",
  },
  {
    key: "maintenance_alerts",
    icon: <Wrench className="h-4 w-4" />,
    label: "유지보수 알림",
    description: "시스템 유지보수 일정 알림을 받습니다.",
    iconColor: "bg-yellow-100 text-yellow-600",
  },
] as const;

export function NotificationTypesCard() {
  const { unsavedSettings, updateUnsavedSettings } =
    useNotificationSettingsStore();

  const handleToggle = (key: string, value: boolean) => {
    updateUnsavedSettings(key as keyof NotificationSettings, value);
  };

  return (
    <Card>
      <NotificationCardHeader
        icon={Bell}
        title="알림 유형 설정"
        description="받고 싶은 알림 유형을 선택하세요."
      />
      <CardContent>
        <div className="space-y-4">
          {(NOTIFICATION_TYPES || []).map((type) => (
            <div
              key={type.key}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${type.iconColor}`}>
                  {type.icon}
                </div>
                <div>
                  <p className="font-medium">{type.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </div>
              <Switch
                checked={Boolean(
                  unsavedSettings?.[type.key as keyof NotificationSettings]
                )}
                onCheckedChange={(checked) => handleToggle(type.key, checked)}
                className="ml-auto"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
