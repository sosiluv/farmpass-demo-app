import { useState } from "react";
import {
  formatDateTime,
  formatResponsiveDateTime,
} from "@/lib/utils/datetime/date";
import { Table, TableBody } from "@/components/ui/table";
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
import { Car, FileText, Calendar, Sparkles } from "lucide-react";
import { getFarmTypeInfo } from "@/lib/constants/farm-types";
import { formatPhoneNumber } from "@/lib/utils/validation";
import {
  VisitorAvatar,
  StatusBadge,
  VisitorDetailModal,
  VisitorActionMenu,
  VisitorTableLoading,
  VisitorTableEmpty,
  VisitorTableRow,
  VisitorTableHeader,
} from "./components";
import type { VisitorWithFarm } from "@/lib/types/visitor";

interface VisitorTableProps {
  visitors: VisitorWithFarm[];
  showFarmColumn?: boolean;
  loading?: boolean;
  isAdmin?: boolean;
  onEdit?: (visitor: VisitorWithFarm) => Promise<void>;
  onDelete?: (visitor: VisitorWithFarm) => Promise<void>;
}

// Î™®Î∞î??Ïπ¥Îìú Î∑?Ïª¥Ìè¨?åÌä∏
function MobileVisitorCard({
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
                        {/* ?ÑÎèÑ/?†Ïßú - ??ÉÅ ??Ï§ÑÎ°ú ?úÏãú */}
                        <p className="font-medium text-gray-700 leading-tight">
                          {datePart}
                        </p>
                        {/* ?úÍ∞Ñ - ?§Ïùå Ï§ÑÏóê ?úÏãú */}
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

          <div className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 bg-emerald-50/80 rounded-lg w-full">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <span className="font-medium text-gray-700 truncate flex-1 cursor-help touch-manipulation">
                  {visitor.visitor_purpose || "Í∏∞Ì?"}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="max-w-[200px] z-[9999]"
                sideOffset={8}
              >
                <p>{visitor.visitor_purpose || "Í∏∞Ì?"}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {visitor.vehicle_number && (
            <div className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 bg-amber-50/80 rounded-lg w-full">
              <Car className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span className="font-medium text-gray-700 truncate flex-1 cursor-help touch-manipulation">
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

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 w-full">
            <div className="flex items-center space-x-1 sm:space-x-2 flex-1 min-w-0">
              {visitor.disinfection_check && (
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              )}
              <span className="text-[10px] sm:text-xs text-gray-500 truncate">
                Î∞©Ïó≠ {visitor.disinfection_check ? "?ÑÎ£å" : "ÎØ∏ÏôÑÎ£?}
              </span>
            </div>
            <button
              onClick={() => onViewDetails(visitor)}
              className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 font-medium flex-shrink-0 ml-2"
            >
              ?ÅÏÑ∏Î≥¥Í∏∞
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VisitorTable({
  visitors,
  showFarmColumn = true,
  loading = false,
  isAdmin = false,
  onEdit,
  onDelete,
}: VisitorTableProps) {
  const [selectedVisitor, setSelectedVisitor] =
    useState<VisitorWithFarm | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (visitor: VisitorWithFarm) => {
    setSelectedVisitor(visitor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVisitor(null);
  };

  // Î°úÎî© ?ÅÌÉú
  if (loading) {
    return <VisitorTableLoading />;
  }

  // Îπ??ÅÌÉú
  if (!visitors || visitors.length === 0) {
    return <VisitorTableEmpty />;
  }

  return (
    <>
      {/* ?∞Ïä§?¨ÌÜ± ?åÏù¥Î∏?Î∑?*/}
      <div className="hidden xl:block">
        <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <Table className="table-fixed min-w-[900px]">
            <VisitorTableHeader
              showFarmColumn={showFarmColumn}
              isAdmin={isAdmin}
            />
            <TableBody>
              {(visitors || []).map((visitor, index) => (
                <VisitorTableRow
                  key={visitor.id}
                  visitor={visitor}
                  index={index}
                  showFarmColumn={showFarmColumn}
                  onViewDetails={handleViewDetails}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Î™®Î∞î??Ïπ¥Îìú Î∑?*/}
      <div className="xl:hidden space-y-3 sm:space-y-4 w-full max-w-full overflow-x-hidden">
        {(visitors || []).map((visitor, index) => (
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
        ))}
      </div>

      {/* Î∞©Î¨∏???ÅÏÑ∏ Î™®Îã¨ */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[92vw] max-w-[360px] sm:max-w-[480px] md:max-w-[580px] lg:max-w-[680px] h-[92vh] max-h-[92vh] sm:h-[85vh] sm:max-h-[85vh] overflow-hidden p-3 sm:p-4 md:p-5 flex flex-col gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {selectedVisitor
                ? `${selectedVisitor.visitor_name} Î∞©Î¨∏???ÅÏÑ∏ ?ïÎ≥¥`
                : "Î∞©Î¨∏???ÅÏÑ∏ ?ïÎ≥¥"}
            </DialogTitle>
            <DialogDescription>
              Î∞©Î¨∏?êÏùò Í∏∞Î≥∏ ?ïÎ≥¥, Î∞©Î¨∏ ?ïÎ≥¥, Î∞©Ïó≠ ?ÅÌÉú ?±ÏùÑ ?ïÏù∏?????àÏäµ?àÎã§.
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
}
