import { useState } from "react";
import {
  ExportSheetWrapper,
  ExportActions,
  DateRangeSection,
  FilterSection,
  OptionsSection,
  SummarySection,
  useExportSheet,
} from "@/components/admin/management/exports";
import { Farm } from "@/lib/types";
import {
  LABELS,
  PLACEHOLDERS,
  VISITOR_TYPE_OPTIONS,
} from "@/lib/constants/visitor";
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

  const { isOpen, setIsOpen, isExporting, handleExport } = useExportSheet({
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
    <ExportSheetWrapper
      open={isOpen}
      onOpenChange={setIsOpen}
      title={LABELS.VISITOR_EXPORT_TITLE}
      description={LABELS.VISITOR_EXPORT_DESC}
      buttonText={LABELS.VISITOR_EXPORT_BUTTON}
    >
      <div className="space-y-4">
        <DateRangeSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          title={LABELS.VISITOR_EXPORT_DATE_RANGE}
          color="blue"
        />
        <FilterSection
          title={LABELS.VISITOR_EXPORT_FILTERS}
          color="green"
          filters={[
            ...(hideFarmFilter
              ? []
              : [
                  {
                    key: "farmFilter",
                    label: LABELS.FILTER_FARM,
                    value: farmFilter,
                    options: [
                      {
                        value: "all",
                        label: PLACEHOLDERS.VISITOR_FILTERS_FARM_ALL,
                      },
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
              label: LABELS.FILTER_VISITOR_TYPE,
              value: visitorType,
              options: [...VISITOR_TYPE_OPTIONS],
              onChange: setVisitorType,
            },
          ]}
        />
        <OptionsSection
          title={LABELS.VISITOR_EXPORT_OPTIONS}
          color="purple"
          selectedCount={selectedOptionsCount}
          totalCount={4}
          options={[
            {
              key: "includeBasic",
              label: LABELS.INFO_TYPE_BASIC,
              description: LABELS.INFO_TYPE_BASIC_DESC,
              checked: includeBasic,
              onChange: setIncludeBasic,
            },
            {
              key: "includeContact",
              label: LABELS.INFO_TYPE_CONTACT,
              description: LABELS.INFO_TYPE_CONTACT_DESC,
              checked: includeContact,
              onChange: setIncludeContact,
            },
            {
              key: "includeVisit",
              label: LABELS.INFO_TYPE_VISIT,
              description: LABELS.INFO_TYPE_VISIT_DESC,
              checked: includeVisit,
              onChange: setIncludeVisit,
            },
            {
              key: "includeExtra",
              label: LABELS.INFO_TYPE_EXTRA,
              description: LABELS.INFO_TYPE_EXTRA_DESC,
              checked: includeExtra,
              onChange: setIncludeExtra,
            },
          ]}
        />
        <SummarySection
          message={LABELS.VISITOR_EXPORT_SUMMARY.replace(
            "{count}",
            selectedOptionsCount.toString()
          )}
          color="orange"
        />
      </div>
      <ExportActions
        isExporting={isExporting}
        canExport={selectedOptionsCount > 0}
        onExport={() => handleExport(exportOptions)}
        onReset={resetOptions}
      />
    </ExportSheetWrapper>
  );
}
