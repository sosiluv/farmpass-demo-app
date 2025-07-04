import { useCallback } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useVisitors } from "@/store/use-visitor-store";
import { exportVisitorsCSV } from "@/lib/utils/data/csv-unified";
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
        toast.showCustomError(
          "방문자 정보 수정 실패",
          "방문자 정보를 수정하는 중 오류가 발생했습니다."
        );
        return;
      }

      try {
        await updateVisitor(visitor.id, visitor.farm_id, {
          visitor_name: visitor.visitor_name,
          visitor_phone: visitor.visitor_phone,
          visitor_address: visitor.visitor_address,
          visitor_purpose: visitor.visitor_purpose,
          vehicle_number: visitor.vehicle_number,
          notes: visitor.notes,
          disinfection_check: visitor.disinfection_check,
        });

        toast.showCustomSuccess(
          "방문자 정보 수정 완료",
          "방문자 정보가 성공적으로 수정되었습니다."
        );
      } catch (error) {
        toast.showCustomError(
          "방문자 정보 수정 실패",
          "방문자 정보를 수정하는 중 오류가 발생했습니다."
        );
      }
    },
    [updateVisitor, toast]
  );

  // 방문자 삭제 핸들러
  const handleDelete = useCallback(
    async (visitor: Visitor) => {
      if (!visitor.id || !visitor.farm_id) {
        toast.showCustomError(
          "방문자 삭제 실패",
          "방문자를 삭제하는 중 오류가 발생했습니다."
        );
        return;
      }

      try {
        await deleteVisitor(visitor.id, visitor.farm_id);
        toast.showCustomSuccess(
          "방문자 삭제 완료",
          "방문자가 성공적으로 삭제되었습니다."
        );
      } catch (error) {
        toast.showCustomError(
          "방문자 삭제 실패",
          "방문자를 삭제하는 중 오류가 발생했습니다."
        );
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

      try {
        const selectedFarm = farms.find((f) => f.id === options.farmFilter);

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

        toast.showCustomSuccess(
          "내보내기 완료",
          "내보내기가 성공적으로 완료되었습니다."
        );
      } catch (error) {
        toast.showCustomError(
          "내보내기 실패",
          "내보내기 중 오류가 발생했습니다."
        );
      }
    },
    [allVisitors, farms, isAdmin, toast]
  );

  return {
    handleEdit,
    handleDelete,
    handleExport,
  };
};
