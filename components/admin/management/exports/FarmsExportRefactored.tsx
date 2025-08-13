import { useState } from "react";
import {
  ExportSheetWrapper,
  ExportActions,
  FilterSection,
  OptionsSection,
  SummarySection,
  useExportSheet,
} from "@/components/admin/management/exports";
import { FARM_TYPE_LABELS } from "@/lib/constants/farm-types";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/management";

interface FarmsExportProps {
  farms: any[];
  onExport: (options: FarmsExportOptions) => Promise<void>;
}

export interface FarmsExportOptions {
  farmType: string;
  status: string;
  includeBasic: boolean;
  includeContact: boolean;
  includeLocation: boolean;
  includeMembers: boolean;
  includeStats: boolean;
}

export function FarmsExportRefactored({ farms, onExport }: FarmsExportProps) {
  // 내보내기 옵션 상태
  const [farmType, setFarmType] = useState("all");
  const [status, setStatus] = useState("all");
  const [includeBasic, setIncludeBasic] = useState(true);
  const [includeContact, setIncludeContact] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [includeMembers, setIncludeMembers] = useState(false);
  const [includeStats, setIncludeStats] = useState(false);

  // 유효성 검사 함수
  const validateOptions = (options: FarmsExportOptions) => {
    const selectedOptions = [
      options.includeBasic,
      options.includeContact,
      options.includeLocation,
      options.includeMembers,
      options.includeStats,
    ].filter(Boolean);

    if (selectedOptions.length === 0) {
      return {
        isValid: false,
        message: "최소 하나의 정보 유형을 선택해야 합니다.",
      };
    }

    return { isValid: true };
  };

  // 공통 훅 사용
  const { isOpen, setIsOpen, isExporting, handleExport } = useExportSheet({
    onExport,
    validateOptions,
    successMessage: "농장 데이터가 성공적으로 내보내졌습니다.",
  });

  const resetOptions = () => {
    setFarmType("all");
    setStatus("all");
    setIncludeBasic(true);
    setIncludeContact(true);
    setIncludeLocation(true);
    setIncludeMembers(false);
    setIncludeStats(false);
  };

  // 선택된 옵션 개수 계산
  const selectedOptionsCount = [
    includeBasic,
    includeContact,
    includeLocation,
    includeMembers,
    includeStats,
  ].filter(Boolean).length;

  const exportOptions: FarmsExportOptions = {
    farmType,
    status,
    includeBasic,
    includeContact,
    includeLocation,
    includeMembers,
    includeStats,
  };

  // 농장 유형 옵션 생성
  const farmTypeOptions = [
    { value: "all", label: LABELS.ALL_TYPES },
    ...Object.entries(FARM_TYPE_LABELS || {}).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  return (
    <ExportSheetWrapper
      open={isOpen}
      onOpenChange={setIsOpen}
      title={PAGE_HEADER.FARMS_EXPORT_TITLE}
      description={PAGE_HEADER.FARMS_EXPORT_DESCRIPTION}
      buttonText={BUTTONS.FARMS_EXPORT_BUTTON}
    >
      <div className="space-y-4">
        {/* 필터 설정 */}
        <FilterSection
          title={LABELS.FILTER_SETTINGS}
          color="green"
          filters={[
            {
              key: "farmType",
              label: LABELS.FARM_TYPE,
              value: farmType,
              options: farmTypeOptions,
              onChange: setFarmType,
            },
            {
              key: "status",
              label: LABELS.STATUS,
              value: status,
              options: [
                { value: "all", label: LABELS.ALL_STATUS },
                { value: "active", label: LABELS.ACTIVE },
                { value: "inactive", label: LABELS.INACTIVE },
              ],
              onChange: setStatus,
            },
          ]}
        />

        {/* 내보내기 옵션 */}
        <OptionsSection
          title={LABELS.INCLUDED_INFO}
          color="purple"
          selectedCount={selectedOptionsCount}
          totalCount={5}
          options={[
            {
              key: "includeBasic",
              label: LABELS.BASIC_INFO,
              description: LABELS.BASIC_INFO_DESC,
              checked: includeBasic,
              onChange: setIncludeBasic,
            },
            {
              key: "includeContact",
              label: LABELS.CONTACT_INFO,
              description: LABELS.CONTACT_INFO_DESC,
              checked: includeContact,
              onChange: setIncludeContact,
            },
            {
              key: "includeLocation",
              label: LABELS.LOCATION_INFO,
              description: LABELS.LOCATION_INFO_DESC,
              checked: includeLocation,
              onChange: setIncludeLocation,
            },
            {
              key: "includeMembers",
              label: LABELS.MEMBER_INFO,
              description: LABELS.MEMBER_INFO_DESC,
              checked: includeMembers,
              onChange: setIncludeMembers,
            },
            {
              key: "includeStats",
              label: LABELS.STATS_INFO,
              description: LABELS.STATS_INFO_DESC,
              checked: includeStats,
              onChange: setIncludeStats,
            },
          ]}
        />

        {/* 요약 정보 */}
        <SummarySection
          message={LABELS.EXPORT_SUMMARY.replace(
            "{totalCount}",
            farms.length.toString()
          )
            .replace("{itemType}", "농장")
            .replace("{selectedCount}", selectedOptionsCount.toString())}
          color="orange"
        />
      </div>

      {/* 액션 버튼 */}
      <ExportActions
        isExporting={isExporting}
        canExport={selectedOptionsCount > 0}
        onExport={() => handleExport(exportOptions)}
        onReset={resetOptions}
      />
    </ExportSheetWrapper>
  );
}
