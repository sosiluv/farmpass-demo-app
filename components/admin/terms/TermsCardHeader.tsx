import React from "react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { LABELS } from "@/lib/constants/terms";

interface TermsCardHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  version: string;
  isActive: boolean;
  publishedAt?: Date;
  updatedAt: Date;
  iconClassName?: string;
  titleClassName?: string;
  actions?: React.ReactNode;
}

const TermsCardHeader = React.memo(function TermsCardHeader({
  icon: Icon,
  title,
  description,
  publishedAt,
  updatedAt,
  iconClassName = "h-5 w-5",
  titleClassName = "text-base",
  actions,
}: TermsCardHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <CardTitle
            className={`flex items-center gap-2 mb-1 ${titleClassName}`}
          >
            <Icon className={iconClassName} />
            {title}
          </CardTitle>
          <CardDescription>
            {description}
            <br />
            {LABELS.LAST_MODIFIED(updatedAt)}
            {publishedAt && (
              <span className="ml-2">
                • {LABELS.PUBLISHED_DATE(publishedAt)}
              </span>
            )}
          </CardDescription>
        </div>
        {actions && <div className="flex-shrink-0 ml-4">{actions}</div>}
      </div>
    </CardHeader>
  );
});

export default TermsCardHeader;
