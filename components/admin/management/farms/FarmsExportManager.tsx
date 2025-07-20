import { downloadAdvancedCSV } from "@/lib/utils/data/csv-unified";
import { getRegionFromAddress } from "@/lib/utils/system/region";
import { formatDateTime } from "@/lib/utils/datetime/date";
import type { FarmsExportOptions } from "../exports";
import type { ExtendedFarm } from "./types";
import { LABELS } from "@/lib/constants/management";

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
    const csvData = (exportFarms || []).map((farm) => {
      const row: Record<string, any> = {};

      if (options.includeBasic) {
        row[LABELS.FARM_NAME_CSV] = farm.farm_name || LABELS.NO_DATA_CSV;
        row[LABELS.FARM_TYPE_CSV] = farm.farm_type || LABELS.NO_DATA_CSV;
        row[LABELS.REGISTRATION_DATE_CSV] = formatDateTime(farm.created_at);
      }

      if (options.includeContact) {
        row[LABELS.FARM_ADDRESS_CSV] = farm.farm_address || LABELS.NO_DATA_CSV;
        row[LABELS.MANAGER_CSV] = farm.owner_name || LABELS.NO_DATA_CSV;
      }

      if (options.includeMembers) {
        row[LABELS.MEMBER_COUNT] = farm.member_count || 0;
      }

      if (options.includeStats) {
        row[LABELS.VISITOR_COUNT] = farm.visitor_count || 0;
        row[LABELS.STATUS_CSV] = farm.is_active
          ? LABELS.ACTIVE_CSV
          : LABELS.INACTIVE_CSV;
      }

      if (options.includeLocation) {
        row[LABELS.REGION] = getRegionFromAddress(farm.farm_address || "");
        row[LABELS.DETAILED_ADDRESS] = farm.farm_address || LABELS.NO_DATA_CSV;
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
