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
    <div className="flex items-center justify-between p-2 sm:p-3 lg:p-4 xl:p-5 bg-white dark:bg-gray-800 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {avatar && (
        <div className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 flex-shrink-0 mr-2 sm:mr-3 lg:mr-4 xl:mr-5">
          {avatar}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-xs sm:text-sm lg:text-base xl:text-lg truncate min-w-0 max-w-[120px] sm:max-w-[200px] lg:max-w-[400px] xl:max-w-[600px] 2xl:max-w-[800px]">
          {primary}
        </div>
        {secondary && (
          <div className="text-[10px] sm:text-xs lg:text-sm xl:text-base text-muted-foreground min-w-0 max-w-[120px] sm:max-w-[200px] lg:max-w-[400px] xl:max-w-[600px] 2xl:max-w-[800px]">
            {secondary}
          </div>
        )}
        {meta && (
          <div className="text-[10px] sm:text-xs lg:text-sm xl:text-base text-muted-foreground min-w-0 max-w-[150px] sm:max-w-[250px] lg:max-w-[450px] xl:max-w-[650px] 2xl:max-w-[850px]">
            {meta}
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2 xl:gap-3 flex-shrink-0 ml-1 sm:ml-2 lg:ml-3 xl:ml-4">
        {badges}
        {actions}
      </div>
    </div>
  );
}
