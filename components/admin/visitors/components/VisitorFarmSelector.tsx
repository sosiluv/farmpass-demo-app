import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { getFarmTypeInfo } from "@/lib/constants/farm-types";
import type { Farm } from "@/lib/types/visitor";

interface VisitorFarmSelectorProps {
  selectedFarm: string;
  farms: Farm[];
  onFarmChange: (value: string) => void;
  showAllOption?: boolean;
}

export function VisitorFarmSelector({
  selectedFarm,
  farms,
  onFarmChange,
  showAllOption = true,
}: VisitorFarmSelectorProps) {
  const getSelectedFarmInfo = () => {
    if (selectedFarm === "all" || !selectedFarm) {
      return {
        name: "전체 농장",
        type: null,
        icon: Building2,
      };
    }

    const farm = farms.find((f) => f.id === selectedFarm);
    if (!farm) {
      return {
        name: "농장을 찾을 수 없음",
        type: null,
        icon: Building2,
      };
    }

    const { Icon } = getFarmTypeInfo(farm.farm_type ?? null);
    return {
      name: farm.farm_name,
      type: farm.farm_type,
      icon: Icon,
    };
  };

  const selectedFarmInfo = getSelectedFarmInfo();
  const Icon = selectedFarmInfo.icon;

  return (
    <Select value={selectedFarm} onValueChange={onFarmChange}>
      <SelectTrigger className="h-8 sm:h-10 md:h-11 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-300 bg-white/90 backdrop-blur-sm text-xs sm:text-sm md:text-base shadow-sm hover:shadow-md min-w-0">
        <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0">
          <div className="p-0.5 sm:p-1 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-md flex-shrink-0">
            <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600 flex-shrink-0" />
          </div>
          <span className="truncate font-medium flex-1 min-w-0">
            {selectedFarmInfo.name}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="max-w-[280px] sm:max-w-sm">
        {showAllOption && (
          <SelectItem value="all">
            <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0">
              <div className="p-0.5 sm:p-1 bg-gradient-to-br from-slate-100 to-gray-100 rounded-md flex-shrink-0">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
              </div>
              <span className="truncate">전체 농장</span>
            </div>
          </SelectItem>
        )}
        {farms.map((farm) => {
          const { Icon } = getFarmTypeInfo(farm.farm_type ?? null);
          return (
            <SelectItem key={farm.id} value={farm.id}>
              <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0">
                <div className="p-0.5 sm:p-1 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-md flex-shrink-0">
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{farm.farm_name}</div>
                  {farm.farm_type && (
                    <div className="text-[10px] sm:text-xs text-indigo-600 font-medium truncate">
                      {getFarmTypeInfo(farm.farm_type).label}
                    </div>
                  )}
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
