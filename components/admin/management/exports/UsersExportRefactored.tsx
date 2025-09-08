import { useState } from "react";
import {
  ExportSheetWrapper,
  ExportActions,
  FilterSection,
  OptionsSection,
  SummarySection,
  useExportSheet,
} from "@/components/admin/management/exports";
import type { UsersExportOptions } from "./types";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/management";

interface UsersExportProps {
  users: any[];
  onExport: (options: UsersExportOptions) => Promise<void>;
}

export function UsersExportRefactored({ users, onExport }: UsersExportProps) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [includeBasic, setIncludeBasic] = useState(true);
  const [includeContact, setIncludeContact] = useState(true);
  const [includeActivity, setIncludeActivity] = useState(false);
  const [includeFarms, setIncludeFarms] = useState(false);
  const [includePermissions, setIncludePermissions] = useState(false);

  const validateOptions = (options: UsersExportOptions) => {
    const selectedOptions = [
      options.includeBasic,
      options.includeContact,
      options.includeActivity,
      options.includeFarms,
      options.includePermissions,
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
    successMessage: "사용자 데이터가 성공적으로 내보내졌습니다.",
  });

  const resetOptions = () => {
    setRoleFilter("all");
    setStatusFilter("all");
    setIncludeBasic(true);
    setIncludeContact(true);
    setIncludeActivity(false);
    setIncludeFarms(false);
    setIncludePermissions(false);
  };

  const selectedOptionsCount = [
    includeBasic,
    includeContact,
    includeActivity,
    includeFarms,
    includePermissions,
  ].filter(Boolean).length;

  const exportOptions: UsersExportOptions = {
    roleFilter,
    statusFilter,
    includeBasic,
    includeContact,
    includeActivity,
    includeFarms,
    includePermissions,
  };

  return (
    <ExportSheetWrapper
      open={isOpen}
      onOpenChange={setIsOpen}
      title={PAGE_HEADER.USERS_EXPORT_TITLE}
      description={PAGE_HEADER.USERS_EXPORT_DESCRIPTION}
      buttonText={BUTTONS.USERS_EXPORT_BUTTON}
    >
      <div className="space-y-4">
        <FilterSection
          title={LABELS.FILTER_SETTINGS}
          color="green"
          filters={[
            {
              key: "roleFilter",
              label: LABELS.ACCOUNT_TYPE,
              value: roleFilter,
              options: [
                { value: "all", label: LABELS.ALL_ACCOUNTS },
                { value: "admin", label: LABELS.ADMIN },
                { value: "user", label: LABELS.GENERAL_USER },
              ],
              onChange: setRoleFilter,
            },
            {
              key: "statusFilter",
              label: LABELS.STATUS,
              value: statusFilter,
              options: [
                { value: "all", label: LABELS.ALL_STATUS },
                { value: "active", label: LABELS.ACTIVE },
                { value: "inactive", label: LABELS.INACTIVE },
              ],
              onChange: setStatusFilter,
            },
          ]}
        />
        <OptionsSection
          title={LABELS.INCLUDED_INFO}
          color="purple"
          selectedCount={selectedOptionsCount}
          totalCount={5}
          options={[
            {
              key: "includeBasic",
              label: LABELS.BASIC_INFO,
              description: LABELS.BASIC_INFO_DESCRIPTION,
              checked: includeBasic,
              onChange: setIncludeBasic,
            },
            {
              key: "includeContact",
              label: LABELS.CONTACT_INFO,
              description: LABELS.CONTACT_INFO_DESCRIPTION,
              checked: includeContact,
              onChange: setIncludeContact,
            },
            {
              key: "includeActivity",
              label: LABELS.ACTIVITY_INFO,
              description: LABELS.ACTIVITY_INFO_DESCRIPTION,
              checked: includeActivity,
              onChange: setIncludeActivity,
            },
            {
              key: "includeFarms",
              label: LABELS.FARM_INFO,
              description: LABELS.FARM_INFO_DESCRIPTION,
              checked: includeFarms,
              onChange: setIncludeFarms,
            },
            {
              key: "includePermissions",
              label: LABELS.PERMISSIONS_INFO,
              description: LABELS.PERMISSIONS_INFO_DESCRIPTION,
              checked: includePermissions,
              onChange: setIncludePermissions,
            },
          ]}
        />
        <SummarySection
          message={LABELS.EXPORT_SUMMARY.replace(
            "{totalCount}",
            users.length.toString()
          )
            .replace("{itemType}", "사용자")
            .replace("{selectedCount}", selectedOptionsCount.toString())}
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
