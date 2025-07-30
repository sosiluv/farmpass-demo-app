import { useCallback } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { exportVisitorsCSV } from "@/lib/utils/data/csv-unified";
import { toKSTDate, createKSTDateRange } from "@/lib/utils/datetime/date";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";
import { useAuth } from "@/components/providers/auth-provider";
import type { VisitorsExportOptions } from "@/components/admin/management/exports/types";
import type { Farm } from "@/lib/types";
import type { VisitorWithFarm } from "@/lib/types/visitor";

// React Query Mutations
import {
  useUpdateVisitorMutation,
  useDeleteVisitorMutation,
} from "@/lib/hooks/query/use-visitor-mutations";

interface UseVisitorActionsProps {
  farms: Farm[];
  isAdmin: boolean;
  profileId?: string;
  allVisitors: VisitorWithFarm[]; // React Query에서 전달받은 방문자 데이터
}

export const useVisitorActions = ({
  farms,
  isAdmin,
  profileId,
  allVisitors,
}: UseVisitorActionsProps) => {
  const { showInfo, showWarning, showSuccess, showError } = useCommonToast();
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;

  // React Query Mutations
  const updateVisitorMutation = useUpdateVisitorMutation();
  const deleteVisitorMutation = useDeleteVisitorMutation();

  // 방문자 수정 핸들러
  const handleEdit = useCallback(
    async (visitor: VisitorWithFarm) => {
      showInfo("방문자 정보 수정 시작", "방문자 정보를 수정하는 중입니다...");
      if (!visitor.id || !visitor.farm_id) {
        showWarning("입력 오류", "방문자 ID 또는 농장 ID가 누락되었습니다.");
        return;
      }

      try {
        const result = await updateVisitorMutation.mutateAsync({
          id: visitor.id,
          farm_id: visitor.farm_id,
          visitor_name: visitor.visitor_name,
          visitor_phone: visitor.visitor_phone,
          visitor_address: visitor.visitor_address,
          visitor_purpose: visitor.visitor_purpose || undefined,
          vehicle_number: visitor.vehicle_number || undefined,
          notes: visitor.notes || undefined,
          disinfection_check: visitor.disinfection_check,
          consent_given: visitor.consent_given,
        });

        showSuccess(
          "방문자 정보 수정 완료",
          result.message || "방문자 정보가 성공적으로 수정되었습니다."
        );
      } catch (error) {
        const authError = getAuthErrorMessage(error);
        showError("방문자 정보 수정 실패", authError.message);
      }
    },
    [updateVisitorMutation, showInfo, showWarning, showSuccess, showError]
  );

  // 방문자 삭제 핸들러
  const handleDelete = useCallback(
    async (visitor: VisitorWithFarm) => {
      showInfo("방문자 삭제 시작", "방문자를 삭제하는 중입니다...");
      if (!visitor.id || !visitor.farm_id) {
        showWarning("입력 오류", "방문자 ID 또는 농장 ID가 누락되었습니다.");
        return;
      }

      try {
        const result = await deleteVisitorMutation.mutateAsync({
          visitorId: visitor.id,
          farmId: visitor.farm_id,
        });
        showSuccess(
          "방문자 삭제 완료",
          result.message || "방문자가 성공적으로 삭제되었습니다."
        );
      } catch (error) {
        const authError = getAuthErrorMessage(error);
        showError("방문자 삭제 실패", authError.message);
      }
    },
    [deleteVisitorMutation, showInfo, showWarning, showSuccess, showError]
  );

  // CSV 내보내기 핸들러
  const handleExport = useCallback(
    async (options: VisitorsExportOptions) => {
      showInfo("내보내기 시작", "방문자 데이터를 내보내는 중입니다...");
      let dataToExport = allVisitors;

      // 농장 필터 적용
      if (options.farmFilter && options.farmFilter !== "all") {
        dataToExport = dataToExport.filter(
          (v) => v.farm_id === options.farmFilter
        );
      }

      // 날짜 필터 적용 - KST 기준
      if (options.startDate || options.endDate) {
        dataToExport = dataToExport.filter((v) => {
          // 방문 시간을 KST로 변환
          const visitDate = new Date(v.visit_datetime);
          const kstVisitDate = toKSTDate(visitDate);

          if (options.startDate) {
            // 시작 날짜를 KST 기준 00:00:00으로 설정
            const startDateKST = createKSTDateRange(options.startDate, false);
            if (kstVisitDate < startDateKST) {
              return false;
            }
          }

          if (options.endDate) {
            // 종료 날짜를 KST 기준 23:59:59로 설정
            const endDateKST = createKSTDateRange(options.endDate, true);
            if (kstVisitDate > endDateKST) {
              return false;
            }
          }

          return true;
        });
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
          farmFilter: options.farmFilter,
          visitorType: options.visitorType,
        });

        showSuccess("내보내기 완료", "내보내기가 성공적으로 완료되었습니다.");
      } catch (error) {
        const authError = getAuthErrorMessage(error);
        showError("내보내기 실패", authError.message);
      }
    },
    [allVisitors, farms, isAdmin, showInfo, showSuccess, showError]
  );

  return {
    handleEdit,
    handleDelete,
    handleExport,
  };
};
