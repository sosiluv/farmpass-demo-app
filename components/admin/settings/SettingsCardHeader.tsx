import React from "react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface SettingsCardHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
  titleClassName?: string;
}

const SettingsCardHeader = React.memo(function SettingsCardHeader({
  icon: Icon,
  title,
  description,
  iconClassName = "h-5 w-5",
  titleClassName = "text-base",
}: SettingsCardHeaderProps) {
  return (
    <CardHeader>
      <CardTitle className={`flex items-center gap-2 ${titleClassName}`}>
        <Icon className={iconClassName} />
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
});

export default SettingsCardHeader;
