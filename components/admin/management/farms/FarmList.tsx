import { CommonListItem } from "../shared/CommonListItem";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Building2, Eye } from "lucide-react";
import { formatDateTime } from "@/lib/utils/datetime/date";
import {
  getFarmTypeLabel,
  getFarmTypeColor,
  getFarmTypeIcon,
} from "@/lib/constants/farm-types";
import { useState } from "react";
import { FarmDetailModal } from "./FarmDetailModal";
import type { Database } from "@/lib/types/supabase";
import { CommonListWrapper } from "../shared/CommonListWrapper";

type Farm = Database["public"]["Tables"]["farms"]["Row"];

interface ExtendedFarm extends Farm {
  owner_name: string;
  member_count: number;
  visitor_count: number;
}

interface FarmListProps {
  farms: ExtendedFarm[];
}

export function FarmList({ farms }: FarmListProps) {
  const [selectedFarm, setSelectedFarm] = useState<ExtendedFarm | null>(null);

  return (
    <>
      <CommonListWrapper>
        {(farms || []).map((farm) => (
          <CommonListItem
            key={farm.id}
            avatar={
              <Avatar className="h-6 w-6 sm:h-10 sm:w-10 lg:h-12 lg:w-12 flex-shrink-0">
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 flex items-center justify-center w-full h-full">
                  {(() => {
                    const Icon = getFarmTypeIcon(farm.farm_type || undefined);
                    return (
                      <Icon className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-blue-600 dark:text-blue-300" />
                    );
                  })()}
                </AvatarFallback>
              </Avatar>
            }
            primary={farm.farm_name}
            secondary={farm.farm_address}
            meta={`${farm.manager_name || "미지정"} / ${formatDateTime(
              farm.created_at
            )}`}
            badges={
              farm.farm_type && (
                <Badge
                  className={`${getFarmTypeColor(
                    farm.farm_type
                  )} text-xs px-2 py-1`}
                >
                  <div className="flex items-center gap-1">
                    {(() => {
                      const Icon = getFarmTypeIcon(farm.farm_type);
                      return <Icon className="h-4 w-4" />;
                    })()}
                    <span>{getFarmTypeLabel(farm.farm_type)}</span>
                  </div>
                </Badge>
              )
            }
            actions={
              <div className="flex items-center gap-2 flex-shrink-0 ml-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                        onClick={() => setSelectedFarm(farm)}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>상세 정보 보기</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
          />
        ))}
      </CommonListWrapper>

      <FarmDetailModal
        farm={selectedFarm}
        isOpen={!!selectedFarm}
        onClose={() => setSelectedFarm(null)}
      />
    </>
  );
}
