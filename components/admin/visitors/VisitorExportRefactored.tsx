import { useState } from "react";
import {
  ExportDialogWrapper,
  ExportActions,
  DateRangeSection,
  FilterSection,
  OptionsSection,
  SummarySection,
  useExportDialog,
} from "@/components/admin/management/exports";
import { Farm } from "@/lib/types";
import type { VisitorsExportOptions } from "@/components/admin/management/exports/types";

interface VisitorExportProps {
  farms: Farm[];
  isAdmin?: boolean;
  onExport: (options: VisitorsExportOptions) => Promise<void>;
  hideFarmFilter?: boolean;
}

export function VisitorExportRefactored({
  farms,
  isAdmin = false,
  onExport,
  hideFarmFilter = false,
}: VisitorExportProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [farmFilter, setFarmFilter] = useState("all");
  const [visitorType, setVisitorType] = useState("all");
  const [includeBasic, setIncludeBasic] = useState(true);
  const [includeContact, setIncludeContact] = useState(true);
  const [includeVisit, setIncludeVisit] = useState(true);
  const [includeExtra, setIncludeExtra] = useState(true);

  const validateOptions = (options: VisitorsExportOptions) => {
    const selectedOptions = [
      options.includeBasic,
      options.includeContact,
      options.includeVisit,
      options.includeExtra,
    ].filter(Boolean);
    if (selectedOptions.length === 0) {
      return {
        isValid: false,
        message: "최소 하나의 정보 유형을 선택해야 합니다.",
      };
    }
    return { isValid: true };
  };

  const { isOpen, setIsOpen, isExporting, handleExport } = useExportDialog({
    onExport,
    validateOptions,
    successMessage: "방문자 데이터가 성공적으로 내보내졌습니다.",
  });

  const resetOptions = () => {
    setStartDate("");
    setEndDate("");
    setFarmFilter("all");
    setVisitorType("all");
    setIncludeBasic(true);
    setIncludeContact(true);
    setIncludeVisit(true);
    setIncludeExtra(true);
  };

  const selectedOptionsCount = [
    includeBasic,
    includeContact,
    includeVisit,
    includeExtra,
  ].filter(Boolean).length;

  const exportOptions: VisitorsExportOptions = {
    startDate,
    endDate,
    farmFilter,
    visitorType,
    includeBasic,
    includeContact,
    includeVisit,
    includeExtra,
  };

  return (
    <ExportDialogWrapper
      open={isOpen}
      onOpenChange={setIsOpen}
      title="방문자 데이터 내보내기"
      description="내보낼 방문자 범위와 정보를 설정하세요"
      buttonText="방문자 내보내기"
    >
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <DateRangeSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          title="방문일 범위"
          color="blue"
        />
        <FilterSection
          title="필터 설정"
          color="green"
          filters={[
            ...(hideFarmFilter
              ? []
              : [
                  {
                    key: "farmFilter",
                    label: "농장",
                    value: farmFilter,
                    options: [
                      { value: "all", label: "전체 농장" },
                      ...(farms || []).map((farm) => ({
                        value: farm.id,
                        label: farm.farm_name,
                      })),
                    ],
                    onChange: setFarmFilter,
                  },
                ]),
            {
              key: "visitorType",
              label: "방문자 유형",
              value: visitorType,
              options: [
                { value: "all", label: "전체" },
                { value: "consented", label: "개인정보 동의자" },
                { value: "disinfected", label: "방역 완료자" },
              ],
              onChange: setVisitorType,
            },
          ]}
        />
        <OptionsSection
          title="포함할 정보"
          color="purple"
          selectedCount={selectedOptionsCount}
          totalCount={4}
          options={[
            {
              key: "includeBasic",
              label: "기본 정보",
              description: "이름, 연락처 등",
              checked: includeBasic,
              onChange: setIncludeBasic,
            },
            {
              key: "includeContact",
              label: "연락처 정보",
              description: "전화번호, 주소 등",
              checked: includeContact,
              onChange: setIncludeContact,
            },
            {
              key: "includeVisit",
              label: "방문 정보",
              description: "방문일, 방문 목적 등",
              checked: includeVisit,
              onChange: setIncludeVisit,
            },
            {
              key: "includeExtra",
              label: "추가 정보",
              description: "비고, 차량번호 등",
              checked: includeExtra,
              onChange: setIncludeExtra,
            },
          ]}
        />
        <SummarySection
          message={`내보내기 요약: 선택된 옵션 ${selectedOptionsCount}개`}
          color="orange"
        />
      </div>
      <ExportActions
        isExporting={isExporting}
        canExport={selectedOptionsCount > 0}
        onExport={() => handleExport(exportOptions)}
        onReset={resetOptions}
      />
    </ExportDialogWrapper>
  );
}
