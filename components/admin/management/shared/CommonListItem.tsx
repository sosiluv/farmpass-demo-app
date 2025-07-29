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
    <div className="flex items-start justify-between p-3 sm:p-4 lg:p-5 bg-white dark:bg-gray-800 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {avatar && (
        <div className="h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 flex-shrink-0 mr-3 sm:mr-4 lg:mr-5">
          {avatar}
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
        <div className="font-semibold text-sm sm:text-base lg:text-lg xl:text-xl truncate min-w-0 max-w-[200px] sm:max-w-[300px] lg:max-w-[400px] xl:max-w-[500px] 2xl:max-w-[600px]">
          {primary}
        </div>
        {secondary && (
          <div className="text-xs sm:text-sm lg:text-base xl:text-lg text-muted-foreground min-w-0 max-w-[250px] sm:max-w-[350px] lg:max-w-[450px] xl:max-w-[550px] 2xl:max-w-[650px] break-words">
            {secondary}
          </div>
        )}
        {meta && (
          <div className="text-xs sm:text-sm lg:text-base xl:text-lg text-muted-foreground min-w-0 max-w-[280px] sm:max-w-[380px] lg:max-w-[480px] xl:max-w-[580px] 2xl:max-w-[680px] break-words">
            {meta}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 sm:gap-3 flex-shrink-0 ml-2 sm:ml-3 lg:ml-4">
        {badges && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-end">
            {badges}
          </div>
        )}
        {actions && (
          <div className="flex items-center gap-1 sm:gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
