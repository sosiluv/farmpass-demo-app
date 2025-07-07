import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import NotificationCardHeader from "./NotificationCardHeader";
import { useNotificationSettingsQueryCompat } from "@/lib/hooks/query/use-notification-settings-query";
import { useNotificationMutations } from "@/lib/hooks/query/use-notification-mutations";
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
  const { data: settings } = useNotificationSettingsQueryCompat();
  const { saveSettings } = useNotificationMutations();

  const handleOptionSelect = (value: string) => {
    if (!settings) return;
    
    saveSettings.mutate({
      ...settings,
      notification_method: value as "push" | "kakao",
    });
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
            {(notificationTypeOptions || []).map((option) => (
              <NotificationTypeCard
                key={option.value}
                title={option.title}
                description={option.description}
                icon={option.icon}
                value={option.value}
                selected={settings?.notification_method === option.value}
                onClick={() =>
                  !option.disabled && handleOptionSelect(option.value)
                }
                disabled={option.disabled}
                badge={option.badge}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              • 웹 푸시: 브라우저에서 실시간 알림을 받으려면 알림 권한을 허용해야
              합니다.
            </p>
            <p>• 카카오톡: 카카오톡 비즈니스 API를 통한 알림입니다. (추후 지원)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
