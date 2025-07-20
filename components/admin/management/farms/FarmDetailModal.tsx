import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, MapPin, Users, Calendar, UserCheck } from "lucide-react";
import { formatDateTime } from "@/lib/utils/datetime/date";
import {
  getFarmTypeLabel,
  getFarmTypeIcon,
  getFarmTypeColor,
} from "@/lib/constants/farm-types";
import { LABELS, PAGE_HEADER } from "@/lib/constants/management";
import type { Database } from "@/lib/types/supabase";

type Farm = Database["public"]["Tables"]["farms"]["Row"];

interface ExtendedFarm extends Farm {
  owner_name: string;
  member_count: number;
  visitor_count: number;
}

interface FarmDetailModalProps {
  farm: ExtendedFarm | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FarmDetailModal({
  farm,
  isOpen,
  onClose,
}: FarmDetailModalProps) {
  if (!farm) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[350px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-3 sm:p-4 md:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base sm:text-lg">
            {PAGE_HEADER.FARM_DETAIL_TITLE}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            {PAGE_HEADER.FARM_DETAIL_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[calc(90vh-8rem)] sm:max-h-[calc(85vh-10rem)]">
          <div className="space-y-4 sm:space-y-6 pr-2 sm:pr-4">
            {/* 기본 정보 */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h3 className="text-base sm:text-lg font-semibold break-all">
                  {farm.farm_name}
                </h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {farm.farm_type && (
                    <Badge
                      variant="outline"
                      className={`${getFarmTypeColor(farm.farm_type)} text-xs`}
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
                    className={`text-xs ${
                      farm.is_active
                        ? "text-green-600 border-green-600"
                        : "text-red-600 border-red-600"
                    }`}
                  >
                    {farm.is_active ? LABELS.ACTIVE : LABELS.INACTIVE}
                  </Badge>
                </div>
              </div>

              {/* 주소 */}
              <div className="p-2 sm:p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2 text-xs sm:text-sm">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                  <div className="break-all">
                    {farm.farm_address}
                    {farm.farm_detailed_address &&
                      ` ${farm.farm_detailed_address}`}
                  </div>
                </div>
              </div>
            </div>

            {/* 관리 정보 */}
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="p-2 sm:p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-xs sm:text-sm mb-2">
                  {LABELS.OWNER_INFO}
                </h4>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-all">
                    {farm.owner_name || LABELS.NO_INFO}
                  </span>
                </div>
              </div>

              {farm.manager_name && (
                <div className="p-2 sm:p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-xs sm:text-sm mb-2">
                    {LABELS.MANAGER_INFO}
                  </h4>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <div className="break-all">
                      <span>{farm.manager_name}</span>
                      {farm.manager_phone && (
                        <span className="block sm:inline sm:ml-1">
                          ({farm.manager_phone})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 통계 정보 */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="p-2 sm:p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-xs sm:text-sm mb-2">
                  {LABELS.REGISTRATION_DATE}
                </h4>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-all">
                    {formatDateTime(farm.created_at)}
                  </span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-xs sm:text-sm mb-2">
                  {LABELS.MEMBERS}
                </h4>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{farm.member_count}명</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-xs sm:text-sm mb-2">
                  {LABELS.TOTAL_VISITORS}
                </h4>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{farm.visitor_count}명</span>
                </div>
              </div>
            </div>

            {/* 추가 정보 */}
            {farm.description && (
              <div className="p-2 sm:p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-xs sm:text-sm mb-2">
                  {LABELS.FARM_DESCRIPTION}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line break-words">
                  {farm.description}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
