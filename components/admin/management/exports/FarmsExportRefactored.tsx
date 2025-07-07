import { useState } from "react";
import {
  ExportDialogWrapper,
  ExportActions,
  FilterSection,
  OptionsSection,
  SummarySection,
  useExportDialog,
} from "./index";
import { FARM_TYPE_LABELS } from "@/lib/constants/farm-types";

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
  const { isOpen, setIsOpen, isExporting, handleExport } = useExportDialog({
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
    { value: "all", label: "모든 유형" },
    ...Object.entries(FARM_TYPE_LABELS || {}).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  return (
    <ExportDialogWrapper
      open={isOpen}
      onOpenChange={setIsOpen}
      title="농장 데이터 내보내기"
      description="내보낼 농장 정보를 설정하세요"
      buttonText="농장 내보내기"
    >
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* 필터 설정 */}
        <FilterSection
          title="필터 설정"
          color="green"
          filters={[
            {
              key: "farmType",
              label: "농장 유형",
              value: farmType,
              options: farmTypeOptions,
              onChange: setFarmType,
            },
            {
              key: "status",
              label: "상태",
              value: status,
              options: [
                { value: "all", label: "모든 상태" },
                { value: "active", label: "활성" },
                { value: "inactive", label: "비활성" },
              ],
              onChange: setStatus,
            },
          ]}
        />

        {/* 내보내기 옵션 */}
        <OptionsSection
          title="포함할 정보"
          color="purple"
          selectedCount={selectedOptionsCount}
          totalCount={5}
          options={[
            {
              key: "includeBasic",
              label: "기본 정보",
              description: "농장명, 유형, 등록일",
              checked: includeBasic,
              onChange: setIncludeBasic,
            },
            {
              key: "includeContact",
              label: "연락처 정보",
              description: "소유자, 관리자, 연락처",
              checked: includeContact,
              onChange: setIncludeContact,
            },
            {
              key: "includeLocation",
              label: "위치 정보",
              description: "주소, 지역",
              checked: includeLocation,
              onChange: setIncludeLocation,
            },
            {
              key: "includeMembers",
              label: "구성원 정보",
              description: "구성원 수",
              checked: includeMembers,
              onChange: setIncludeMembers,
            },
            {
              key: "includeStats",
              label: "통계 정보",
              description: "방문자 수, 상태",
              checked: includeStats,
              onChange: setIncludeStats,
            },
          ]}
        />

        {/* 요약 정보 */}
        <SummarySection
          message={`내보내기 요약: 총 ${farms.length}개의 농장 중 ${selectedOptionsCount}개 정보 유형이 포함됩니다.`}
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
    </ExportDialogWrapper>
  );
}
