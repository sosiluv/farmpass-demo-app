import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Badge,
  User,
  Building2,
  Calendar,
  FileText,
  Car,
  Sparkles,
  Eye,
} from "lucide-react";
import { LABELS } from "@/lib/constants/visitor";

interface VisitorTableHeaderProps {
  showFarmColumn?: boolean;
  isAdmin?: boolean;
}

/**
 * 방문자 테이블 헤더 컴포넌트
 */
export function VisitorTableHeader({
  showFarmColumn = true,
  isAdmin = false,
}: VisitorTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
        {/* 번호 */}
        <TableHead className="w-16 sm:w-20 text-center">
          <div className="flex items-center justify-center space-x-1">
            <Badge className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5">
              {LABELS.VISITOR_TABLE_HEADER_NUMBER}
            </Badge>
          </div>
        </TableHead>

        {/* 방문자 정보 */}
        <TableHead className="w-32 sm:w-40">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <User className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              {LABELS.VISITOR_TABLE_HEADER_VISITOR}
            </span>
          </div>
        </TableHead>

        {/* 농장 정보 (조건부 표시) */}
        {showFarmColumn && (
          <TableHead className="w-32 sm:w-40">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                {LABELS.VISITOR_TABLE_HEADER_FARM}
              </span>
            </div>
          </TableHead>
        )}

        {/* 방문일시 */}
        <TableHead className="w-24 sm:w-28">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              {LABELS.VISITOR_TABLE_HEADER_VISIT_DATETIME}
            </span>
          </div>
        </TableHead>

        {/* 방문목적 */}
        <TableHead className="w-28 sm:w-32">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              {LABELS.VISITOR_TABLE_HEADER_VISIT_PURPOSE}
            </span>
          </div>
        </TableHead>

        {/* 차량번호 */}
        <TableHead className="w-24 sm:w-28">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Car className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              {LABELS.VISITOR_TABLE_HEADER_VEHICLE_NUMBER}
            </span>
          </div>
        </TableHead>

        {/* 방역 완료 상태 */}
        <TableHead className="w-20 sm:w-24">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              {LABELS.VISITOR_TABLE_HEADER_DISINFECTION}
            </span>
          </div>
        </TableHead>

        {/* 액션 */}
        <TableHead className="w-16 sm:w-20 text-center">
          <div className="flex items-center justify-center space-x-1">
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              {LABELS.VISITOR_TABLE_HEADER_ACTION}
            </span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
