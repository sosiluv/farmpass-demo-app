import { useState } from "react";
import type { SystemLog } from "@/lib/types/system";
import { LOG_CATEGORIES_NO_ICON } from "@/lib/constants/log-categories";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/management";
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
      title={PAGE_HEADER.LOGS_EXPORT_TITLE}
      description={PAGE_HEADER.LOGS_EXPORT_DESCRIPTION}
      buttonText={BUTTONS.LOGS_EXPORT_BUTTON}
    >
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* 날짜 범위 설정 */}
        <DateRangeSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          title={LABELS.DATE_RANGE}
          color="blue"
        />

        {/* 필터 설정 */}
        <FilterSection
          title={LABELS.FILTER_SETTINGS}
          color="green"
          filters={[
            {
              key: "levelFilter",
              label: LABELS.LOG_LEVEL,
              value: levelFilter,
              options: [
                { value: "all", label: LABELS.ALL_LEVELS },
                { value: "info", label: LABELS.INFO },
                { value: "warn", label: LABELS.WARN },
                { value: "error", label: LABELS.ERROR },
                { value: "debug", label: LABELS.DEBUG },
              ],
              onChange: setLevelFilter,
            },
            {
              key: "categoryFilter",
              label: LABELS.CATEGORY,
              value: categoryFilter,
              options: LOG_CATEGORIES_NO_ICON,
              onChange: setCategoryFilter,
            },
          ]}
        />

        {/* 내보내기 옵션 */}
        <OptionsSection
          title={LABELS.INCLUDED_INFO}
          color="purple"
          selectedCount={selectedOptionsCount}
          totalCount={4}
          options={[
            {
              key: "includeBasic",
              label: LABELS.BASIC_INFO,
              description: "액션, 메시지, 시간",
              checked: includeBasic,
              onChange: setIncludeBasic,
            },
            {
              key: "includeUser",
              label: LABELS.USER_INFO,
              description: LABELS.USER_INFO_DESC,
              checked: includeUser,
              onChange: setIncludeUser,
            },
            {
              key: "includeSystem",
              label: LABELS.SYSTEM_INFO,
              description: LABELS.SYSTEM_INFO_DESC,
              checked: includeSystem,
              onChange: setIncludeSystem,
            },
            {
              key: "includeMetadata",
              label: LABELS.METADATA,
              description: LABELS.METADATA_DESC,
              checked: includeMetadata,
              onChange: setIncludeMetadata,
            },
          ]}
        />

        {/* 요약 정보 */}
        <SummarySection
          message={LABELS.EXPORT_SUMMARY.replace(
            "{totalCount}",
            logs.length.toString()
          )
            .replace("{itemType}", "로그")
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
    </ExportDialogWrapper>
  );
}
