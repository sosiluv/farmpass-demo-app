import { Sheet } from "@/components/ui/sheet";
import {
  CommonSheetHeader,
  CommonSheetContent,
} from "@/components/ui/sheet-common";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils/datetime/date";
import {
  getFarmTypeLabel,
  getFarmTypeIcon,
  getFarmTypeColor,
} from "@/lib/constants/farm-types";
import { LABELS, PAGE_HEADER } from "@/lib/constants/management";
import type { Farm } from "@/lib/types/common";

type FarmWithExtras = Farm & {
  owner_name: string;
  member_count: number;
  visitor_count: number;
};

interface FarmDetailSheetProps {
  farm: FarmWithExtras | null;
  open: boolean;
  onClose: () => void;
}

export function FarmDetailSheet({ farm, open, onClose }: FarmDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <CommonSheetContent
        side="bottom"
        showHandle={true}
        enableDragToClose={true}
        dragDirection="vertical"
        dragThreshold={50}
        onClose={onClose}
      >
        <CommonSheetHeader
          title={PAGE_HEADER.FARM_DETAIL_TITLE}
          description={PAGE_HEADER.FARM_DETAIL_DESCRIPTION}
        />
        {farm ? (
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="space-y-4 pr-2 pb-4">
              {/* 기본 정보 */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <Avatar className="h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 flex-shrink-0 rounded-full bg-gray-50 flex items-center justify-center">
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 flex items-center justify-center w-full h-full">
                    {(() => {
                      const Icon = getFarmTypeIcon(farm.farm_type || undefined);
                      return (
                        <Icon className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-blue-600 dark:text-blue-300" />
                      );
                    })()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left flex-1">
                  <div className="text-lg sm:text-xl md:text-2xl font-semibold break-all">
                    {farm.farm_name}
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground break-all">
                    {farm.farm_address}
                    {farm.farm_detailed_address &&
                      ` ${farm.farm_detailed_address}`}
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-2 mt-2">
                    {farm.farm_type && (
                      <Badge
                        variant="outline"
                        className={`${getFarmTypeColor(
                          farm.farm_type
                        )} text-xs sm:text-sm`}
                      >
                        <div className="flex items-center gap-1">
                          {(() => {
                            const Icon = getFarmTypeIcon(farm.farm_type);
                            return <Icon className="h-3 w-3" />;
                          })()}
                          {getFarmTypeLabel(farm.farm_type)}
                        </div>
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-xs sm:text-sm ${
                        farm.is_active
                          ? "text-green-600 border-green-600"
                          : "text-red-600 border-red-600"
                      }`}
                    >
                      {farm.is_active ? LABELS.ACTIVE : LABELS.INACTIVE}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 관리 정보 */}
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.OWNER_INFO}
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm sm:text-base break-all">
                      {farm.owner_name || LABELS.NO_INFO}
                    </div>
                  </div>

                  {farm.manager_name && (
                    <div className="p-2 sm:p-3 bg-muted rounded-lg">
                      <div className="font-medium text-foreground text-sm sm:text-base">
                        {LABELS.MANAGER_INFO}
                      </div>
                      <div className="text-muted-foreground mt-1 text-sm sm:text-base break-all">
                        <span>{farm.manager_name}</span>
                        {farm.manager_phone && (
                          <span className="block sm:inline sm:ml-1">
                            ({farm.manager_phone})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 통계 정보 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.REGISTRATION_DATE}
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm sm:text-base">
                      {formatDateTime(farm.created_at)}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.MEMBERS}
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm sm:text-base">
                      {farm.member_count}명
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.TOTAL_VISITORS}
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm sm:text-base">
                      {farm.visitor_count}명
                    </div>
                  </div>
                </div>
              </div>

              {/* 추가 정보 */}
              {farm.description && (
                <div className="p-2 sm:p-3 bg-muted rounded-lg">
                  <div className="font-medium text-foreground text-sm sm:text-base">
                    {LABELS.FARM_DESCRIPTION}
                  </div>
                  <div className="text-muted-foreground mt-1 text-sm sm:text-base whitespace-pre-line break-words">
                    {farm.description}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            {LABELS.NO_FARM_INFO}
          </div>
        )}
      </CommonSheetContent>
    </Sheet>
  );
}
