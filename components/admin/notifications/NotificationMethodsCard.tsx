import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import NotificationCardHeader from "./NotificationCardHeader";
import { BellRing, MessageSquare } from "lucide-react";
import NotificationTypeCard from "@/components/admin/notifications/NotificationTypeCard";
import type { NotificationSettings } from "@/lib/types/notification";
import { LABELS, PAGE_HEADER } from "@/lib/constants/notifications";

// 알림 방식 옵션
const notificationTypeOptions = [
  {
    title: LABELS.PUSH_NOTIFICATION,
    description: LABELS.PUSH_NOTIFICATION_DESC,
    icon: <BellRing className="h-5 w-5 text-primary" />,
    value: "push" as const,
    badge: "권장",
  },
  {
    title: LABELS.SMS_NOTIFICATION,
    description: LABELS.SMS_NOTIFICATION_DESC,
    icon: <MessageSquare className="h-5 w-5 text-muted-foreground" />,
    value: "kakao" as const,
    disabled: true,
  },
];

interface NotificationMethodsCardProps {
  settings: NotificationSettings | null;
  onSettingChange: <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => void;
}

export function NotificationMethodsCard({
  settings,
  onSettingChange,
}: NotificationMethodsCardProps) {
  const handleOptionSelect = (value: string) => {
    onSettingChange("notification_method", value as "push" | "kakao");
  };

  return (
    <Card>
      <NotificationCardHeader
        icon={Bell}
        title={PAGE_HEADER.NOTIFICATION_SETTINGS}
        description={PAGE_HEADER.NOTIFICATION_SETTINGS_DESC}
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
              • {LABELS.PUSH_NOTIFICATION}: {LABELS.PUSH_NOTIFICATION_DESC}
            </p>
            <p>
              • {LABELS.SMS_NOTIFICATION}: {LABELS.SMS_NOTIFICATION_DESC}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
