import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Farm } from "@/lib/types/farm";

interface FarmSelectorProps {
  selectedFarm: string;
  onFarmChange: (farmId: string) => void;
  availableFarms: Farm[];
  isAdmin: boolean;
}

export function FarmSelector({
  selectedFarm,
  onFarmChange,
  availableFarms,
  isAdmin,
}: FarmSelectorProps) {
  return (
    <div className="flex flex-col gap-1 sm:gap-1.5">
      <Select value={selectedFarm} onValueChange={onFarmChange}>
        <SelectTrigger className="w-full sm:w-[250px] md:w-[280px] h-8 sm:h-9 md:h-10 text-xs sm:text-sm">
          <SelectValue placeholder="농장을 선택하세요" />
        </SelectTrigger>
        <SelectContent>
          {isAdmin && <SelectItem value="all">전체 농장</SelectItem>}
          {(availableFarms || []).map((farm) => (
            <SelectItem key={farm.id} value={farm.id}>
              {farm.farm_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[10px] sm:text-xs text-muted-foreground px-1">
        {isAdmin
          ? "전체 또는 특정 농장의 통계를 확인할 수 있습니다"
          : "관리 중인 농장을 선택하세요"}
      </p>
    </div>
  );
}
