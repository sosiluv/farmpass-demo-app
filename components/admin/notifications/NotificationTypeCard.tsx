import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationTypeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: "push" | "kakao";
  selected: boolean;
  onClick: () => void;
  badge?: string;
  disabled?: boolean;
}

const NotificationTypeCard = React.memo(function NotificationTypeCard({
  title,
  description,
  icon,
  value,
  selected,
  onClick,
  badge,
  disabled,
}: NotificationTypeCardProps) {
  return (
    <Card
      className={cn(
        "relative transition-all",
        !disabled && "cursor-pointer hover:border-primary",
        selected && !disabled && "border-primary bg-primary/5",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      {selected && (
        <div className="absolute top-3 right-3">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
      )}
    </Card>
  );
});

export default NotificationTypeCard;
