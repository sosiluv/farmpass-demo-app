import { Sprout, MapPin, Phone, AlertTriangle, User2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Farm } from "@/lib/types/visitor";

interface FarmInfoCardProps {
  farm: Farm;
}

export const FarmInfoCard = ({ farm }: FarmInfoCardProps) => {
  return (
    <Card className="mb-2 sm:mb-8 shadow-lg rounded-lg sm:rounded-2xl border border-gray-200 bg-white/90">
      <CardHeader className="pb-0.5 sm:pb-2 border-b border-gray-100">
        <div className="flex items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
          <Sprout className="h-3.5 sm:h-7 w-3.5 sm:w-7 text-green-600" />
          <CardTitle className="text-sm sm:text-2xl font-bold tracking-tight text-gray-900 break-all">
            {farm.farm_name}
          </CardTitle>
        </div>
        <CardDescription className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-base text-gray-600">
          <MapPin className="h-2.5 sm:h-4 w-2.5 sm:w-4 flex-shrink-0 text-blue-500" />
          <span className="break-all">{farm.farm_address}</span>
        </CardDescription>
        <div className="mt-1 sm:mt-2 mb-0.5 text-[10px] sm:text-sm text-gray-700 font-medium">
          용무가 있으신 분은 아래로 연락바랍니다.
        </div>
      </CardHeader>
      <CardContent className="pt-1.5 sm:pt-4 space-y-1.5 sm:space-y-4">
        {/* 축사출입금지 안내 */}
        <Alert className="mb-1 sm:mb-2 border-0 bg-gradient-to-r from-red-100 to-orange-50 shadow-none flex items-center gap-1 sm:gap-2 py-1.5 px-1.5 sm:px-3">
          <AlertTriangle className="h-2.5 sm:h-5 w-2.5 sm:w-5 text-red-600 flex-shrink-0" />
          <AlertDescription className="font-semibold text-red-700 text-[10px] sm:text-base">
            🚫 축사출입금지 - 방역상 출입을 금지합니다
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3">
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <span className="text-[9px] sm:text-xs text-gray-500">관리자</span>
            <span className="flex items-center gap-0.5 sm:gap-1 font-medium text-gray-800">
              <User2 className="h-2.5 sm:h-4 w-2.5 sm:w-4 text-gray-400 flex-shrink-0" />
              <span className="break-all text-[10px] sm:text-base">
                {farm.manager_name}
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <span className="text-[9px] sm:text-xs text-gray-500">연락처</span>
            <span className="flex items-center gap-0.5 sm:gap-1 font-medium text-gray-800">
              <Phone className="h-2.5 sm:h-4 w-2.5 sm:w-4 text-blue-400 flex-shrink-0" />
              <span className="break-all text-[10px] sm:text-base">
                {farm.manager_phone}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
