import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getFarmTypeLabel,
  getFarmTypeIcon,
  getFarmTypeColor,
} from "@/lib/constants/farm-types";
import type { Farm } from "@/lib/hooks/use-farms";

interface FarmCardHeaderProps {
  farm: Farm;
  isOwner: boolean;
}

export function FarmCardHeader({ farm, isOwner }: FarmCardHeaderProps) {
  return (
    <div className="space-y-2">
      {/* 농장명과 배지 */}
      <div className="space-y-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CardTitle className="text-lg font-bold truncate cursor-help min-h-[1.75rem] flex items-center">
                {farm.farm_name}
              </CardTitle>
            </TooltipTrigger>
            <TooltipContent>
              <p>{farm.farm_name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center">
            <Badge
              variant="outline"
              className={`text-xs whitespace-nowrap inline-flex items-center gap-1 ${getFarmTypeColor(
                farm.farm_type || undefined
              )}`}
            >
              {(() => {
                const Icon = getFarmTypeIcon(farm.farm_type || undefined);
                return <Icon className="h-3 w-3 flex-shrink-0" />;
              })()}
              <span className="whitespace-nowrap">
                {getFarmTypeLabel(farm.farm_type || undefined)}
              </span>
            </Badge>
          </div>
        </div>
      </div>

      {/* 소유자가 아닌 경우 안내 - 모든 화면 크기에서 별도 줄에 표시 */}
      {!isOwner && (
        <div className="text-xs text-muted-foreground px-3 py-2 bg-gray-50 rounded-md text-center border border-gray-200">
          💡 소유자만 수정/삭제 가능
        </div>
      )}
    </div>
  );
}
