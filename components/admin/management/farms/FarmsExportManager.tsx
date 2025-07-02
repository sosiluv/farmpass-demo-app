import { downloadAdvancedCSV } from "@/lib/utils/data/csv-unified";
import { getRegionFromAddress } from "@/lib/utils/system/region";
import {
  formatDateTime,
  getKSTDateTimeForFileName,
} from "@/lib/utils/datetime/date";
import type { FarmsExportOptions } from "../exports";
import type { ExtendedFarm } from "./types";

interface FarmsExportManagerProps {
  farms: ExtendedFarm[];
  filterFn: (farm: ExtendedFarm) => boolean;
  children: (actions: {
    handleFarmsExport: (options: FarmsExportOptions) => Promise<void>;
  }) => React.ReactNode;
}

export function FarmsExportManager({
  farms,
  filterFn,
  children,
}: FarmsExportManagerProps) {
  // 농장 내보내기 처리
  const handleFarmsExport = async (options: FarmsExportOptions) => {
    // 필터링된 농장에서 내보내기 옵션에 따라 데이터 생성
    let exportFarms = farms.filter(filterFn);

    // 추가 필터링
    if (options.farmType !== "all") {
      exportFarms = exportFarms.filter(
        (farm) => farm.farm_type === options.farmType
      );
    }
    if (options.status !== "all") {
      if (options.status === "active") {
        exportFarms = exportFarms.filter((farm) => farm.is_active);
      } else if (options.status === "inactive") {
        exportFarms = exportFarms.filter((farm) => !farm.is_active);
      }
    }

    // CSV 데이터 생성
    const csvData = exportFarms.map((farm) => {
      const row: Record<string, any> = {};

      if (options.includeBasic) {
        row["농장명"] = farm.farm_name || "-";
        row["농장유형"] = farm.farm_type || "-";
        row["등록일"] = formatDateTime(farm.created_at);
      }

      if (options.includeContact) {
        row["농장주소"] = farm.farm_address || "-";
        row["담당자"] = farm.owner_name || "-";
      }

      if (options.includeMembers) {
        row["구성원수"] = farm.member_count || 0;
      }

      if (options.includeStats) {
        row["방문자수"] = farm.visitor_count || 0;
        row["상태"] = farm.is_active ? "활성" : "비활성";
      }

      if (options.includeLocation) {
        row["지역"] = getRegionFromAddress(farm.farm_address || "");
        row["상세주소"] = farm.farm_address || "-";
      }

      return row;
    });

    downloadAdvancedCSV(csvData, {
      filename: "farms",
      includeDate: true,
      includeBOM: true,
    });
  };

  return (
    <>
      {children({
        handleFarmsExport,
      })}
    </>
  );
}
