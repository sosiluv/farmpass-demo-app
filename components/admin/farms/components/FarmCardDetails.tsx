import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MapPin, Phone, Users, Building2 } from "lucide-react";
import type { Farm } from "@/lib/types/common";

interface FarmCardDetailsProps {
  farm: Farm;
}

export function FarmCardDetails({ farm }: FarmCardDetailsProps) {
  return (
    <div className="space-y-4 text-sm flex-1">
      {/* 주소 섹션 */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="group cursor-help">
              <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-700 dark:to-slate-600 rounded-lg border border-slate-200/50 dark:border-slate-600/50 hover:border-slate-300/70 dark:hover:border-slate-500/70 transition-all duration-200">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-800/50 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-700/50 transition-colors">
                  <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                    주소
                  </div>
                  <div className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                    {farm.farm_address}
                    {farm.farm_detailed_address && (
                      <>
                        <br />
                        <span className="text-base text-slate-500 dark:text-slate-400 mt-1 block">
                          {farm.farm_detailed_address}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{farm.farm_address}</p>
              {farm.farm_detailed_address && (
                <p className="text-xs text-muted-foreground">
                  {farm.farm_detailed_address}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 관리자 정보 섹션 */}
      {(farm.manager_name || farm.manager_phone) && (
        <div className="space-y-2">
          {farm.manager_name && (
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50 hover:border-emerald-300/70 dark:hover:border-emerald-600/70 transition-all duration-200">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-800/50 rounded-lg">
                <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                  관리자
                </div>
                <div className="text-base text-slate-700 dark:text-slate-200 font-medium">
                  {farm.manager_name}
                </div>
              </div>
            </div>
          )}

          {farm.manager_phone && (
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200/50 dark:border-purple-700/50 hover:border-purple-300/70 dark:hover:border-purple-600/70 transition-all duration-200">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-800/50 rounded-lg">
                <Phone className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  연락처
                </div>
                <div className="text-base text-slate-700 dark:text-slate-200 font-medium">
                  {farm.manager_phone}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 설명 섹션 */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="group cursor-help">
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg border border-amber-200/50 dark:border-amber-700/50 hover:border-amber-300/70 dark:hover:border-amber-600/70 transition-all duration-200">
                <div className="flex items-start space-x-3">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-800/50 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-700/50 transition-colors">
                    <Building2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                      설명
                    </div>
                    <div
                      className="text-base text-slate-700 dark:text-slate-200 leading-relaxed"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {farm.description || "설명이 없습니다"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">농장 설명</p>
              <p className="text-base whitespace-pre-wrap">
                {farm.description || "설명이 없습니다"}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
