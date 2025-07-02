import { useState } from "react";
import {
  ExportDialogWrapper,
  ExportActions,
  FilterSection,
  OptionsSection,
  SummarySection,
  useExportDialog,
} from "./index";
import type { UsersExportOptions } from "./types";

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

  const { isOpen, setIsOpen, isExporting, handleExport } = useExportDialog({
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
    <ExportDialogWrapper
      open={isOpen}
      onOpenChange={setIsOpen}
      title="사용자 데이터 내보내기"
      description="내보낼 사용자 정보를 설정하세요"
      buttonText="사용자 내보내기"
    >
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <FilterSection
          title="필터 설정"
          color="green"
          filters={[
            {
              key: "roleFilter",
              label: "계정 유형",
              value: roleFilter,
              options: [
                { value: "all", label: "모든 계정" },
                { value: "admin", label: "관리자" },
                { value: "user", label: "일반 사용자" },
              ],
              onChange: setRoleFilter,
            },
            {
              key: "statusFilter",
              label: "상태",
              value: statusFilter,
              options: [
                { value: "all", label: "모든 상태" },
                { value: "active", label: "활성" },
                { value: "inactive", label: "비활성" },
              ],
              onChange: setStatusFilter,
            },
          ]}
        />
        <OptionsSection
          title="포함할 정보"
          color="purple"
          selectedCount={selectedOptionsCount}
          totalCount={5}
          options={[
            {
              key: "includeBasic",
              label: "기본 정보",
              description: "이름, 이메일, 계정 타입",
              checked: includeBasic,
              onChange: setIncludeBasic,
            },
            {
              key: "includeContact",
              label: "연락처 정보",
              description: "전화번호, 주소",
              checked: includeContact,
              onChange: setIncludeContact,
            },
            {
              key: "includeActivity",
              label: "활동 정보",
              description: "마지막 로그인, 활동 기록",
              checked: includeActivity,
              onChange: setIncludeActivity,
            },
            {
              key: "includeFarms",
              label: "농장 정보",
              description: "소속 농장, 권한",
              checked: includeFarms,
              onChange: setIncludeFarms,
            },
            {
              key: "includePermissions",
              label: "권한 정보",
              description: "세부 권한 설정",
              checked: includePermissions,
              onChange: setIncludePermissions,
            },
          ]}
        />
        <SummarySection
          message={`내보내기 요약: 총 ${users.length}명의 사용자 중 ${selectedOptionsCount}개 정보 유형이 포함됩니다.`}
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
