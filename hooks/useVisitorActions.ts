import { useCallback } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useVisitors } from "@/store/use-visitor-store";
import { exportVisitorsCSV } from "@/lib/utils/data/csv-unified";
import {
  logVisitorDataAccess,
  logVisitorDataExport,
} from "@/lib/utils/logging/system-log";
import { useAuth } from "@/components/providers/auth-provider";
import type { VisitorsExportOptions } from "@/components/admin/management/exports/types";
import type { Visitor } from "@/store/use-visitor-store";
import type { Farm } from "@/lib/types";

interface UseVisitorActionsProps {
  farms: Farm[];
  isAdmin: boolean;
  profileId?: string;
}

export const useVisitorActions = ({
  farms,
  isAdmin,
  profileId,
}: UseVisitorActionsProps) => {
  const toast = useCommonToast();
  const { updateVisitor, deleteVisitor, allVisitors } = useVisitors();
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;

  // 방문자 수정 핸들러
  const handleEdit = useCallback(
    async (visitor: Visitor) => {
      if (!visitor.id || !visitor.farm_id) {
        devLog.error("방문자 수정 실패: ID가 없음", visitor);
        toast.showError("VISITOR_UPDATE_FAILED");
        return;
      }

      try {
        devLog.log("방문자 수정 시작:", visitor);

        await updateVisitor(visitor.id, visitor.farm_id, {
          visitor_name: visitor.visitor_name,
          visitor_phone: visitor.visitor_phone,
          visitor_address: visitor.visitor_address,
          visitor_purpose: visitor.visitor_purpose,
          vehicle_number: visitor.vehicle_number,
          notes: visitor.notes,
          disinfection_check: visitor.disinfection_check,
        });

        devLog.log("방문자 수정 완료");
        toast.showSuccess("VISITOR_UPDATED");
      } catch (error) {
        devLog.error("방문자 수정 실패:", error);
        toast.showError("VISITOR_UPDATE_FAILED");
      }
    },
    [updateVisitor, toast]
  );

  // 방문자 삭제 핸들러
  const handleDelete = useCallback(
    async (visitor: Visitor) => {
      if (!visitor.id || !visitor.farm_id) {
        devLog.error("방문자 삭제 실패: ID가 없음", visitor);
        toast.showError("VISITOR_DELETE_FAILED");
        return;
      }

      try {
        await deleteVisitor(visitor.id, visitor.farm_id);
        devLog.log("방문자 삭제 완료");
        toast.showSuccess("VISITOR_DELETED");
      } catch (error) {
        devLog.error("방문자 삭제 실패:", error);
        toast.showError("VISITOR_DELETE_FAILED");
      }
    },
    [deleteVisitor, toast]
  );

  // CSV 내보내기 핸들러
  const handleExport = useCallback(
    async (options: VisitorsExportOptions) => {
      let dataToExport = allVisitors;

      // 농장 필터 적용
      if (options.farmFilter && options.farmFilter !== "all") {
        dataToExport = dataToExport.filter(
          (v) => v.farm_id === options.farmFilter
        );
      }

      // 날짜 필터 적용
      if (options.startDate) {
        const startDate = new Date(options.startDate);
        startDate.setHours(0, 0, 0, 0);
        dataToExport = dataToExport.filter(
          (v) => new Date(v.visit_datetime) >= startDate
        );
      }

      if (options.endDate) {
        const endDate = new Date(options.endDate);
        endDate.setHours(23, 59, 59, 999);
        dataToExport = dataToExport.filter(
          (v) => new Date(v.visit_datetime) <= endDate
        );
      }

      // 방문자 유형 필터 적용
      if (options.visitorType === "consented") {
        dataToExport = dataToExport.filter((v) => v.consent_given);
      } else if (options.visitorType === "disinfected") {
        dataToExport = dataToExport.filter((v) => v.disinfection_check);
      }

      // 방문자 데이터 내보내기 로그 기록
      if (profileId) {
        try {
          const selectedFarm = farms.find((f) => f.id === options.farmFilter);
          const includeFields = [];
          if (options.includeBasic) includeFields.push("기본정보");
          if (options.includeContact) includeFields.push("연락처");
          if (options.includeVisit) includeFields.push("방문정보");
          if (options.includeExtra) includeFields.push("추가정보");

          await logVisitorDataExport(dataToExport.length, profileId, {
            farm_id:
              options.farmFilter && options.farmFilter !== "all"
                ? options.farmFilter
                : undefined,
            farm_name: selectedFarm?.farm_name,
            format: "csv",
            date_range: {
              start: options.startDate,
              end: options.endDate,
            },
            include_fields: includeFields,
            filter_applied: {
              farm_filter: options.farmFilter,
              visitor_type: options.visitorType,
              date_filtered: !!(options.startDate || options.endDate),
            },
          });

          await exportVisitorsCSV(dataToExport, {
            includeBasic: options.includeBasic,
            includeContact: options.includeContact,
            includeVisit: options.includeVisit,
            includeExtra: options.includeExtra,
            includeFarm: isAdmin,
            filename: `방문자기록${
              selectedFarm ? `_${selectedFarm.farm_name}` : ""
            }`,
            includeDate: true,
            useAdvancedParser: true,
          });

          toast.showSuccess("DATA_EXPORTED");
        } catch (error) {
          const selectedFarm = farms.find((f) => f.id === options.farmFilter);
          await logVisitorDataAccess(
            "EXPORT_FAILED",
            profileId,
            user?.email,
            {
              farm_id:
                options.farmFilter && options.farmFilter !== "all"
                  ? options.farmFilter
                  : undefined,
              farm_name: selectedFarm?.farm_name,
              visitor_count: dataToExport.length,
              access_scope:
                options.farmFilter && options.farmFilter !== "all"
                  ? "single_farm"
                  : isAdmin
                  ? "all_farms"
                  : "own_farms",
              export_format: "csv",
              error: error instanceof Error ? error.message : String(error),
              date_range: {
                start: options.startDate,
                end: options.endDate,
              },
            },
            undefined
          );
          toast.showError("DATA_EXPORT_FAILED");
        }
      }
    },
    [allVisitors, farms, isAdmin, profileId, toast]
  );

  return {
    handleEdit,
    handleDelete,
    handleExport,
  };
};
