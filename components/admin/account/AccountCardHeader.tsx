import { LucideIcon } from "lucide-react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AccountCardHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
  titleClassName?: string;
}

export default function AccountCardHeader({
  icon: Icon,
  title,
  description,
  iconClassName = "h-5 w-5",
  titleClassName = "text-base",
}: AccountCardHeaderProps) {
  return (
    <CardHeader>
      <CardTitle className={`flex items-center gap-2 ${titleClassName}`}>
        <Icon className={iconClassName} />
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
}
