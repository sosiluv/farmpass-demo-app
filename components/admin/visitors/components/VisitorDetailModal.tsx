import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  MapPin,
  Car,
  FileText,
  Clock,
  User,
  Shield,
  Calendar,
} from "lucide-react";
import { getFarmTypeInfo } from "@/lib/constants/farm-types";
import { formatPhoneNumber } from "@/lib/utils/validation";
import { formatResponsiveDateTime } from "@/lib/utils/datetime/date";
import { VisitorAvatar } from "./VisitorAvatar";
import { StatusBadge } from "./StatusBadge";
import { useAuth } from "@/components/providers/auth-provider";
import type { VisitorWithFarm } from "@/lib/types/visitor";
import { LABELS } from "@/lib/constants/visitor";

interface VisitorDetailModalProps {
  visitor: VisitorWithFarm | null;
  onClose: () => void;
}

export function VisitorDetailModal({
  visitor,
  onClose,
}: VisitorDetailModalProps) {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;

  if (!visitor) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-4 pb-3 sm:pb-4 flex-shrink-0 border-b border-gray-100">
        <VisitorAvatar
          name={visitor.visitor_name}
          imageUrl={visitor.profile_photo_url}
          disinfectionCheck={visitor.disinfection_check}
          size="lg"
        />
        <div className="text-center sm:text-left">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white break-all leading-tight">
            {visitor.visitor_name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            {LABELS.VISITOR_DETAIL_TITLE}
          </p>
        </div>
      </div>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <ScrollArea className="flex-1 min-h-0 pr-1 sm:pr-2 mt-3 sm:mt-4">
        <div className="space-y-3 sm:space-y-4 pb-2">
          {/* 기본 정보 */}
          <Card className="bg-gradient-to-br from-gray-50 to-white border border-gray-200/60">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-semibold flex items-center space-x-2 text-gray-700">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                <span>{LABELS.VISITOR_DETAIL_BASIC_INFO}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 pt-0">
              <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/80 rounded-lg border border-gray-100">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
                    {LABELS.VISITOR_DETAIL_CONTACT}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 break-all">
                    {formatPhoneNumber(visitor.visitor_phone)}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/80 rounded-lg border border-gray-100">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
                    {LABELS.VISITOR_DETAIL_ADDRESS}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 leading-relaxed break-all">
                    {visitor.visitor_address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 방문 정보 */}
          <Card className="bg-gradient-to-br from-blue-50 to-white border border-blue-200/60">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-semibold flex items-center space-x-2 text-blue-700">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                <span>{LABELS.VISITOR_DETAIL_VISIT_INFO}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 pt-0">
              <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/80 rounded-lg border border-blue-100">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-blue-600 font-medium">
                    방문일시
                  </p>
                  {(() => {
                    const { datePart, timePart, fullDateTime } =
                      formatResponsiveDateTime(visitor.visit_datetime);
                    return (
                      <div>
                        {/* 년도/날짜 - 항상 한 줄로 표시 */}
                        <p className="text-xs sm:text-sm font-bold text-blue-800 leading-tight">
                          {datePart}
                        </p>
                        {/* 시간 - 다음 줄에 표시 */}
                        <p className="text-[10px] sm:text-xs text-blue-600 leading-tight">
                          {timePart}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/80 rounded-lg border border-blue-100">
                {(() => {
                  const { Icon } = getFarmTypeInfo(
                    visitor.farms?.farm_type ?? null
                  );
                  return (
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-blue-600 font-medium">
                    방문 농장
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-blue-800 break-all">
                    {visitor.farms?.farm_name || LABELS.VISITOR_DETAIL_UNKNOWN}
                  </p>
                  {visitor.farms?.farm_type && (
                    <Badge
                      variant="secondary"
                      className="mt-1 text-[10px] sm:text-xs bg-purple-100 text-purple-700 border-purple-200"
                    >
                      {getFarmTypeInfo(visitor.farms.farm_type ?? null).label}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/80 rounded-lg border border-blue-100">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-blue-600 font-medium">
                    {LABELS.VISITOR_DETAIL_VISIT_PURPOSE}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-blue-800 leading-relaxed break-all">
                    {visitor.visitor_purpose || LABELS.VISITOR_DETAIL_OTHER}
                  </p>
                </div>
              </div>
              {visitor.vehicle_number && (
                <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/80 rounded-lg border border-blue-100">
                  <Car className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-blue-600 font-medium">
                      {LABELS.VISITOR_DETAIL_VEHICLE_NUMBER}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-blue-800 break-all">
                      {visitor.vehicle_number}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 방역 및 동의 정보 */}
          <Card className="bg-gradient-to-br from-green-50 to-white border border-green-200/60">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-semibold flex items-center space-x-2 text-green-700">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                <span>{LABELS.VISITOR_DETAIL_DISINFECTION_INFO}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 pt-0">
              <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/80 rounded-lg border border-green-100">
                <StatusBadge isCompleted={visitor.disinfection_check} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-green-600 font-medium">
                    {LABELS.VISITOR_DETAIL_DISINFECTION_STATUS}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-green-800">
                    {visitor.disinfection_check
                      ? LABELS.VISITOR_DETAIL_DISINFECTION_COMPLETED
                      : LABELS.VISITOR_DETAIL_DISINFECTION_INCOMPLETED}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/80 rounded-lg border border-green-100">
                <Badge
                  variant={visitor.consent_given ? "default" : "secondary"}
                  className={`text-[10px] sm:text-xs ${
                    visitor.consent_given
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {visitor.consent_given
                    ? LABELS.VISITOR_DETAIL_CONSENT_COMPLETED
                    : LABELS.VISITOR_DETAIL_CONSENT_INCOMPLETED}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-green-600 font-medium">
                    {LABELS.VISITOR_DETAIL_CONSENT}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-green-800">
                    {visitor.consent_given
                      ? LABELS.VISITOR_DETAIL_CONSENT_AGREED
                      : LABELS.VISITOR_DETAIL_CONSENT_DISAGREED}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 추가 정보 */}
          {visitor.notes && (
            <Card className="bg-gradient-to-br from-amber-50 to-white border border-amber-200/60">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-semibold flex items-center space-x-2 text-amber-700">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                  <span>{LABELS.VISITOR_DETAIL_EXTRA_INFO}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="p-2 sm:p-3 bg-white/80 rounded-lg border border-amber-100">
                  <p className="text-xs sm:text-sm font-semibold text-amber-800 leading-relaxed break-all">
                    {visitor.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
