import { useState, useMemo, useCallback, memo } from "react";
import { VirtualizedTable } from "@/components/common/VirtualizedTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Car,
  FileText,
  Eye,
  User,
  Calendar,
  Sparkles,
  Building2,
} from "lucide-react";
import { getFarmTypeInfo } from "@/lib/constants/farm-types";
import { formatPhoneNumber } from "@/lib/utils/validation";
import { formatResponsiveDateTime } from "@/lib/utils/datetime/date";
import {
  VisitorAvatar,
  StatusBadge,
  VisitorDetailModal,
  VisitorActionMenu,
  VisitorTableLoading,
  VisitorTableEmpty,
} from "./components";
import type { VisitorWithFarm } from "@/lib/types/visitor";

interface VisitorVirtualizedTableProps {
  visitors: VisitorWithFarm[];
  showFarmColumn?: boolean;
  loading?: boolean;
  isAdmin?: boolean;
  onEdit?: (visitor: VisitorWithFarm) => Promise<void>;
  onDelete?: (visitor: VisitorWithFarm) => Promise<void>;
}

// 모바??카드 �?컴포?�트
const MobileVisitorCard = memo(function MobileVisitorCard({
  visitor,
  index,
  showFarmColumn,
  onViewDetails,
  isAdmin,
  onEdit,
  onDelete,
}: {
  visitor: VisitorWithFarm;
  index: number;
  showFarmColumn: boolean;
  onViewDetails: (visitor: VisitorWithFarm) => void;
  isAdmin?: boolean;
  onEdit?: (visitor: VisitorWithFarm) => Promise<void>;
  onDelete?: (visitor: VisitorWithFarm) => Promise<void>;
}) {
  return (
    <Card className="border border-gray-200/60 hover:border-gray-300 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm overflow-hidden group">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <VisitorAvatar
              name={visitor.visitor_name}
              imageUrl={visitor.profile_photo_url}
              disinfectionCheck={visitor.disinfection_check}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base max-w-[120px] sm:max-w-none cursor-help touch-manipulation">
                      {visitor.visitor_name}
                    </h4>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    className="max-w-[200px] z-[9999]"
                    sideOffset={8}
                  >
                    <p>{visitor.visitor_name}</p>
                  </TooltipContent>
                </Tooltip>
                <Badge
                  variant="outline"
                  className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 font-medium"
                >
                  #{index + 1}
                </Badge>
              </div>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium cursor-help touch-manipulation">
                    {formatPhoneNumber(visitor.visitor_phone)}
                  </p>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="max-w-[200px] z-[9999]"
                  sideOffset={8}
                >
                  <p>{formatPhoneNumber(visitor.visitor_phone)}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge isCompleted={visitor.disinfection_check} />
            {isAdmin && (
              <VisitorActionMenu
                visitor={visitor}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )}
          </div>
        </div>

        <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-start space-x-2 sm:space-x-3 p-1.5 sm:p-2 bg-gray-50/80 rounded-lg">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              {(() => {
                const { datePart, timePart, fullDateTime } =
                  formatResponsiveDateTime(visitor.visit_datetime);
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        {/* ?�도/?�짜 - ??�� ??줄로 ?�시 */}
                        <p className="font-medium text-gray-700 leading-tight">
                          {datePart}
                        </p>
                        {/* ?�간 - ?�음 줄에 ?�시 */}
                        <p className="text-[10px] sm:text-xs text-gray-600 leading-tight">
                          {timePart}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{fullDateTime}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })()}
            </div>
          </div>

          {showFarmColumn && visitor.farms && (
            <div className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 bg-purple-50/80 rounded-lg">
              {(() => {
                const { Icon } = getFarmTypeInfo(
                  visitor.farms?.farm_type ?? null
                );
                return (
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                );
              })()}
              <div className="min-w-0 flex-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs sm:text-sm text-gray-700 font-medium truncate cursor-help">
                      {visitor.farms?.farm_name}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{visitor.farms?.farm_name}</p>
                  </TooltipContent>
                </Tooltip>
                {visitor.farms?.farm_type && (
                  <div className="text-[10px] sm:text-xs text-purple-600 font-medium">
                    {getFarmTypeInfo(visitor.farms.farm_type ?? null).label}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 bg-emerald-50/80 rounded-lg">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <span className="font-medium text-gray-700 truncate cursor-help touch-manipulation">
                  {visitor.visitor_purpose || "기�?"}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="max-w-[200px] z-[9999]"
                sideOffset={8}
              >
                <p>{visitor.visitor_purpose || "기�?"}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {visitor.vehicle_number && (
            <div className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 bg-amber-50/80 rounded-lg">
              <Car className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span className="font-medium text-gray-700 cursor-help touch-manipulation">
                    {visitor.vehicle_number}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="max-w-[200px] z-[9999]"
                  sideOffset={8}
                >
                  <p>{visitor.vehicle_number}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              {visitor.disinfection_check && (
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              )}
              <span className="text-[10px] sm:text-xs text-gray-500">
                방역 {visitor.disinfection_check ? "완료" : "미완료"}
              </span>
            </div>
            <button
              onClick={() => onViewDetails(visitor)}
              className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              ?�세보기
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ?�스?�톱 ?�이�???컴포?�트
const DesktopTableRow = memo(function DesktopTableRow({
  visitor,
  index,
  showFarmColumn,
  onViewDetails,
  isAdmin,
  onEdit,
  onDelete,
}: {
  visitor: VisitorWithFarm;
  index: number;
  showFarmColumn: boolean;
  onViewDetails: (visitor: VisitorWithFarm) => void;
  isAdmin?: boolean;
  onEdit?: (visitor: VisitorWithFarm) => Promise<void>;
  onDelete?: (visitor: VisitorWithFarm) => Promise<void>;
}) {
  return (
    <div className="flex border-b border-gray-100 hover:bg-gray-50/80 transition-colors duration-200 group w-full min-w-0">
      {/* 번호 */}
      <div className="flex-shrink-0 w-16 sm:w-20 px-2 sm:px-3 py-3 flex items-center justify-center">
        <Badge
          variant="outline"
          className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 font-medium"
        >
          #{index + 1}
        </Badge>
      </div>

      {/* 방문???�보 */}
      <div className="flex-1 min-w-[150px] px-3 py-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <VisitorAvatar
            name={visitor.visitor_name}
            imageUrl={visitor.profile_photo_url}
            disinfectionCheck={visitor.disinfection_check}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                {visitor.visitor_name}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
              {formatPhoneNumber(visitor.visitor_phone)}
            </p>
          </div>
        </div>
      </div>

      {/* ?�장 ?�보 (조건부 ?�시) */}
      {showFarmColumn && (
        <div className="flex-1 min-w-[120px] px-2 sm:px-3 py-3">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              ?�장
            </span>
          </div>
        </div>
      )}

      {/* 방문?�시 */}
      <div className="flex-1 min-w-[100px] px-2 sm:px-3 py-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            방문?�시
          </span>
        </div>
      </div>

      {/* 방문목적 */}
      <div className="flex-1 min-w-[100px] px-2 sm:px-3 py-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            방문목적
          </span>
        </div>
      </div>

      {/* 차량번호 */}
      <div className="flex-1 min-w-[80px] px-2 sm:px-3 py-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Car className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            차량번호
          </span>
        </div>
      </div>

      {/* 방역 ?�료 ?�태 */}
      <div className="flex-1 w-12 sm:w-16 min-w-0 px-2 sm:px-3 py-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            방역
          </span>
        </div>
      </div>

      {/* ?�션 */}
      <div className="flex-shrink-0 w-12 sm:w-16 text-center min-w-0 px-2 sm:px-3 py-3">
        <div className="flex items-center justify-center space-x-1">
          <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            ?�션
          </span>
        </div>
      </div>
    </div>
  );
});

// ?�스?�톱 ?�이�??�더 컴포?�트
const DesktopTableHeader = memo(function DesktopTableHeader({
  showFarmColumn,
  isAdmin,
}: {
  showFarmColumn: boolean;
  isAdmin?: boolean;
}) {
  return (
    <div className="flex bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200 font-medium text-gray-700 text-sm w-full min-w-0">
      {/* 번호 */}
      <div className="flex-shrink-0 w-16 sm:w-20 px-2 sm:px-3 py-3 text-center">
        <div className="flex items-center justify-center space-x-1">
          <Badge className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5">
            번호
          </Badge>
        </div>
      </div>

      {/* 방문???�보 */}
      <div className="flex-1 min-w-[150px] px-3 py-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <User className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            방문??
          </span>
        </div>
      </div>

      {/* ?�장 ?�보 (조건부 ?�시) */}
      {showFarmColumn && (
        <div className="flex-1 min-w-[120px] px-2 sm:px-3 py-3">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              ?�장
            </span>
          </div>
        </div>
      )}

      {/* 방문?�시 */}
      <div className="flex-1 min-w-[100px] px-2 sm:px-3 py-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            방문?�시
          </span>
        </div>
      </div>

      {/* 방문목적 */}
      <div className="flex-1 min-w-[100px] px-2 sm:px-3 py-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            방문목적
          </span>
        </div>
      </div>

      {/* 차량번호 */}
      <div className="flex-1 min-w-[80px] px-2 sm:px-3 py-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Car className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            차량번호
          </span>
        </div>
      </div>

      {/* 방역 ?�료 ?�태 */}
      <div className="flex-1 w-12 sm:w-16 min-w-0 px-2 sm:px-3 py-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            방역
          </span>
        </div>
      </div>

      {/* ?�션 */}
      <div className="flex-shrink-0 w-12 sm:w-16 text-center min-w-0 px-2 sm:px-3 py-3">
        <div className="flex items-center justify-center space-x-1">
          <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            ?�션
          </span>
        </div>
      </div>
    </div>
  );
});

export const VisitorVirtualizedTable = memo(function VisitorVirtualizedTable({
  visitors,
  showFarmColumn = true,
  loading = false,
  isAdmin = false,
  onEdit,
  onDelete,
}: VisitorVirtualizedTableProps) {
  const [selectedVisitor, setSelectedVisitor] =
    useState<VisitorWithFarm | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 메모?�제?�션???�들?�들
  const handleViewDetails = useCallback((visitor: VisitorWithFarm) => {
    setSelectedVisitor(visitor);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedVisitor(null);
  }, []);

  // 메모?�제?�션???�더 ?�수??
  const renderDesktopRow = useCallback(
    (visitor: VisitorWithFarm, index: number) => (
      <DesktopTableRow
        visitor={visitor}
        index={index}
        showFarmColumn={showFarmColumn}
        onViewDetails={handleViewDetails}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
    [showFarmColumn, handleViewDetails, isAdmin, onEdit, onDelete]
  );

  const renderMobileCard = useCallback(
    (visitor: VisitorWithFarm, index: number) => (
      <MobileVisitorCard
        key={visitor.id}
        visitor={visitor}
        index={index}
        showFarmColumn={showFarmColumn}
        onViewDetails={handleViewDetails}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
    [showFarmColumn, handleViewDetails, isAdmin, onEdit, onDelete]
  );

  // 메모?�제?�션???�더
  const desktopHeader = useMemo(
    () => (
      <DesktopTableHeader showFarmColumn={showFarmColumn} isAdmin={isAdmin} />
    ),
    [showFarmColumn, isAdmin]
  );

  // 로딩 ?�태
  if (loading) {
    return <VisitorTableLoading />;
  }

  // �??�태
  if (!visitors || visitors.length === 0) {
    return <VisitorTableEmpty />;
  }

  return (
    <>
      {/* ?�스?�톱 가?�화 ?�이�?*/}
      <div className="hidden lg:block w-full">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden w-full">
          {desktopHeader}
          <VirtualizedTable
            data={visitors}
            height={600}
            rowHeight={72}
            renderRow={renderDesktopRow}
            keyExtractor={(visitor: VisitorWithFarm) => visitor.id}
          />
        </div>
      </div>

      {/* ?�블�?모바??카드 �?*/}
      <div className="lg:hidden space-y-3 sm:space-y-4">
        {(visitors || []).map(renderMobileCard)}
      </div>

      {/* 방문???�세 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-[350px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-3 sm:p-4 md:p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {selectedVisitor
                ? `${selectedVisitor.visitor_name} 방문???�세 ?�보`
                : "방문???�세 ?�보"}
            </DialogTitle>
            <DialogDescription>
              방문?�의 기본 ?�보, 방문 ?�보, 방역 ?�태 ?�을 ?�인?????�습?�다.
            </DialogDescription>
          </DialogHeader>
          <VisitorDetailModal
            visitor={selectedVisitor}
            onClose={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    </>
  );
});
