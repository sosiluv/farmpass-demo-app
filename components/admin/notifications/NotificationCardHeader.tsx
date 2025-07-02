import { LucideIcon } from "lucide-react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface NotificationCardHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  iconClassName?: string;
  titleClassName?: string;
}

export default function NotificationCardHeader({
  icon: Icon,
  title,
  description,
  iconClassName = "h-5 w-5",
  titleClassName = "text-base",
}: NotificationCardHeaderProps) {
  return (
    <CardHeader>
      <CardTitle className={`flex items-center gap-2 ${titleClassName}`}>
        {Icon && <Icon className={iconClassName} />}
        {title}
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
  );
}
