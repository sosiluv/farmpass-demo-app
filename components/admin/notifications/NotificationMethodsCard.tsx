import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import NotificationCardHeader from "./NotificationCardHeader";
import { useNotificationSettingsStore } from "@/store/use-notification-settings-store";
import { BellRing, MessageSquare } from "lucide-react";
import NotificationTypeCard from "@/components/admin/notifications/NotificationTypeCard";

// 알림 방식 옵션을 메모이제이션
const notificationTypeOptions = [
  {
    title: "웹 푸시",
    description:
      "브라우저를 통해 실시간 알림을 받을 수 있습니다. 데스크톱과 모바일 모두 지원됩니다.",
    icon: <BellRing className="h-5 w-5 text-primary" />,
    value: "push" as const,
    badge: "권장",
  },
  {
    title: "카카오톡",
    description: "카카오톡 메시지를 통해 알림을 받을 수 있습니다. (미구현)",
    icon: <MessageSquare className="h-5 w-5 text-muted-foreground" />,
    value: "kakao" as const,
    disabled: true,
  },
];

export function NotificationMethodsCard() {
  const { unsavedSettings, updateUnsavedSettings } =
    useNotificationSettingsStore();

  const handleMethodChange = (value: string) => {
    updateUnsavedSettings("notification_method", value);
  };

  return (
    <Card>
      <NotificationCardHeader
        icon={Bell}
        title="알림 방식 설정"
        description="알림을 받을 방식을 선택하세요. 웹 푸시 알림 또는 카카오톡 알림 중 하나를 선택할 수 있습니다."
      />
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {notificationTypeOptions.map((option) => (
              <NotificationTypeCard
                key={option.value}
                title={option.title}
                description={option.description}
                icon={option.icon}
                value={option.value}
                selected={unsavedSettings?.notification_method === option.value}
                onClick={() =>
                  !option.disabled && handleMethodChange(option.value)
                }
                badge={option.badge}
                disabled={option.disabled}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
