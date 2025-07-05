import { Building2, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Farm } from "@/lib/types";

interface ExportFiltersProps {
  farms: Farm[];
  farmFilter: string;
  visitorType: string;
  onFarmFilterChange: (value: string) => void;
  onVisitorTypeChange: (value: string) => void;
}

export function ExportFilters({
  farms,
  farmFilter,
  visitorType,
  onFarmFilterChange,
  onVisitorTypeChange,
}: ExportFiltersProps) {
  return (
    <Card className="border border-green-200 dark:border-green-700 bg-green-50/50 dark:bg-green-900/50">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-200 text-sm sm:text-base">
          <Filter className="h-4 w-4" />
          <span>필터 설정</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {farms.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-100">
              농장 선택
            </Label>
            <Select value={farmFilter} onValueChange={onFarmFilterChange}>
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                <SelectValue placeholder="농장을 선택하세요" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                <SelectItem value="all">모든 농장</SelectItem>
                {farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id}>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-3 w-3" />
                      <span>{farm.farm_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-100">
            방문자 유형
          </Label>
          <Select value={visitorType} onValueChange={onVisitorTypeChange}>
            <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
              <SelectValue placeholder="방문자 유형을 선택하세요" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
              <SelectItem value="all">모든 방문자</SelectItem>
              <SelectItem value="consented">개인정보 동의자</SelectItem>
              <SelectItem value="disinfected">방역 완료자</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
