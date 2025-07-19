import React from "react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface SettingsCardHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
  titleClassName?: string;
  actions?: React.ReactNode;
}

const SettingsCardHeader = React.memo(function SettingsCardHeader({
  icon: Icon,
  title,
  description,
  iconClassName = "h-5 w-5",
  titleClassName = "text-base",
  actions,
}: SettingsCardHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <CardTitle className={`flex items-center gap-2 ${titleClassName}`}>
            <Icon className={iconClassName} />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {actions && <div className="flex-shrink-0 ml-4">{actions}</div>}
      </div>
    </CardHeader>
  );
});

export default SettingsCardHeader;
