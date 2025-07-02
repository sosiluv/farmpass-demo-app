import { useState, useMemo } from "react";
import { getRegionFromAddress } from "@/lib/utils/system/region";
import type { FarmFilters } from "./FarmFilters";
import type { ExtendedFarm } from "./types";

interface FarmsFilterManagerProps {
  farms: ExtendedFarm[];
  children: (data: {
    filters: FarmFilters;
    setFilters: (filters: FarmFilters) => void;
    filterFn: (farm: ExtendedFarm) => boolean;
    sortFn: (a: ExtendedFarm, b: ExtendedFarm) => number;
  }) => React.ReactNode;
}

export function FarmsFilterManager({
  farms,
  children,
}: FarmsFilterManagerProps) {
  const [filters, setFilters] = useState<FarmFilters>({
    search: "",
    type: "all",
    region: "all",
    status: "all",
  });

  // 필터링 함수
  const filterFn = useMemo(() => {
    return (farm: ExtendedFarm) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = farm.farm_name?.toLowerCase().includes(searchLower);
        const addressMatch = farm.farm_address
          ?.toLowerCase()
          .includes(searchLower);
        const ownerMatch = farm.owner_name?.toLowerCase().includes(searchLower);
        if (!nameMatch && !addressMatch && !ownerMatch) return false;
      }

      if (filters.type !== "all" && farm.farm_type !== filters.type) {
        return false;
      }

      if (filters.region !== "all") {
        const farmRegion = getRegionFromAddress(farm.farm_address || "");
        if (farmRegion !== filters.region) return false;
      }

      if (filters.status === "active" && !farm.is_active) {
        return false;
      }

      if (filters.status === "inactive" && farm.is_active) {
        return false;
      }

      return true;
    };
  }, [filters]);

  // 정렬 함수 (최신 생성순)
  const sortFn = useMemo(() => {
    return (a: ExtendedFarm, b: ExtendedFarm) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }, []);

  return (
    <>
      {children({
        filters,
        setFilters,
        filterFn,
        sortFn,
      })}
    </>
  );
}
