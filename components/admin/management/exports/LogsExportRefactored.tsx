import { useState } from "react";
import type { SystemLog } from "@/lib/types/system";
import { LOG_CATEGORIES_NO_ICON } from "@/lib/constants/log-categories";
import {
  ExportDialogWrapper,
  DateRangeSection,
  FilterSection,
  OptionsSection,
  SummarySection,
  ExportActions,
  useExportDialog,
} from "./index";

interface LogsExportProps {
  logs: SystemLog[];
  onExport: (options: LogsExportOptions) => Promise<void>;
}

export interface LogsExportOptions {
  startDate: string;
  endDate: string;
  levelFilter: string;
  categoryFilter: string;
  includeBasic: boolean;
  includeUser: boolean;
  includeSystem: boolean;
  includeMetadata: boolean;
}

export function LogsExportRefactored({ logs, onExport }: LogsExportProps) {
  // 내보내기 옵션 상태
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [includeBasic, setIncludeBasic] = useState(true);
  const [includeUser, setIncludeUser] = useState(true);
  const [includeSystem, setIncludeSystem] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);

  // 유효성 검사 함수
  const validateOptions = (options: LogsExportOptions) => {
    if (
      options.startDate &&
      options.endDate &&
      new Date(options.startDate) > new Date(options.endDate)
    ) {
      return {
        isValid: false,
        message: "시작 날짜는 종료 날짜보다 이전이어야 합니다.",
      };
    }

    const selectedOptions = [
      options.includeBasic,
      options.includeUser,
      options.includeSystem,
      options.includeMetadata,
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
    successMessage: "로그 데이터가 성공적으로 내보내졌습니다.",
  });

  const resetOptions = () => {
    setStartDate("");
    setEndDate("");
    setLevelFilter("all");
    setCategoryFilter("all");
    setIncludeBasic(true);
    setIncludeUser(true);
    setIncludeSystem(false);
    setIncludeMetadata(false);
  };

  // 선택된 옵션 개수 계산
  const selectedOptionsCount = [
    includeBasic,
    includeUser,
    includeSystem,
    includeMetadata,
  ].filter(Boolean).length;

  const exportOptions: LogsExportOptions = {
    startDate,
    endDate,
    levelFilter,
    categoryFilter,
    includeBasic,
    includeUser,
    includeSystem,
    includeMetadata,
  };

  return (
    <ExportDialogWrapper
      open={isOpen}
      onOpenChange={setIsOpen}
      title="시스템 로그 내보내기"
      description="내보낼 로그 범위와 정보를 설정하세요"
      buttonText="로그 내보내기"
    >
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* 날짜 범위 설정 */}
        <DateRangeSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          title="날짜 범위"
          color="blue"
        />

        {/* 필터 설정 */}
        <FilterSection
          title="필터 설정"
          color="green"
          filters={[
            {
              key: "levelFilter",
              label: "로그 레벨",
              value: levelFilter,
              options: [
                { value: "all", label: "모든 레벨" },
                { value: "info", label: "정보" },
                { value: "warn", label: "경고" },
                { value: "error", label: "오류" },
                { value: "debug", label: "디버그" },
              ],
              onChange: setLevelFilter,
            },
            {
              key: "categoryFilter",
              label: "카테고리",
              value: categoryFilter,
              options: LOG_CATEGORIES_NO_ICON,
              onChange: setCategoryFilter,
            },
          ]}
        />

        {/* 내보내기 옵션 */}
        <OptionsSection
          title="포함할 정보"
          color="purple"
          selectedCount={selectedOptionsCount}
          totalCount={4}
          options={[
            {
              key: "includeBasic",
              label: "기본 정보",
              description: "액션, 메시지, 시간",
              checked: includeBasic,
              onChange: setIncludeBasic,
            },
            {
              key: "includeUser",
              label: "사용자 정보",
              description: "이메일, IP 주소",
              checked: includeUser,
              onChange: setIncludeUser,
            },
            {
              key: "includeSystem",
              label: "시스템 정보",
              description: "레벨, 카테고리",
              checked: includeSystem,
              onChange: setIncludeSystem,
            },
            {
              key: "includeMetadata",
              label: "메타데이터",
              description: "상세 정보, 컨텍스트",
              checked: includeMetadata,
              onChange: setIncludeMetadata,
            },
          ]}
        />

        {/* 요약 정보 */}
        <SummarySection
          message={`내보내기 요약: 총 ${logs.length}개의 로그 중 ${selectedOptionsCount}개 정보 유형이 포함됩니다.`}
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
