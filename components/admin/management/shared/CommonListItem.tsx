import { ReactNode } from "react";

interface CommonListItemProps {
  avatar?: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
}

export function CommonListItem({
  avatar,
  primary,
  secondary,
  meta,
  badges,
  actions,
}: CommonListItemProps) {
  return (
    <div className="flex flex-col p-3 sm:p-4 lg:p-5 bg-white dark:bg-gray-800 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-start">
        {avatar && <div className="mr-3 sm:mr-4 lg:mr-5">{avatar}</div>}
        <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
          <div className="font-semibold text-sm sm:text-base lg:text-lg break-words min-w-0">
            {primary}
          </div>
          {secondary && (
            <div className="text-xs sm:text-sm lg:text-base text-muted-foreground min-w-0 break-words">
              {secondary}
            </div>
          )}
          {meta && (
            <div className="text-xs sm:text-sm lg:text-base text-muted-foreground min-w-0 break-words">
              {meta}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 sm:gap-3 pt-1 sm:pt-2">
            {badges}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
