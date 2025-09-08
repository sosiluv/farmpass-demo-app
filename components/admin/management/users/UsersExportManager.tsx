import { downloadAdvancedCSV } from "@/lib/utils/data/csv-unified";
import { formatDateTime } from "@/lib/utils/datetime/date";
import { LABELS } from "@/lib/constants/management";
import type { UsersExportOptions } from "../exports";
import { type UserProfileWithFarmMembers } from "@/lib/hooks/query/use-admin-users-query";

interface UsersExportManagerProps {
  users: UserProfileWithFarmMembers[];
  filterFn: (user: UserProfileWithFarmMembers) => boolean;
  children: (actions: {
    handleUsersExport: (options: UsersExportOptions) => Promise<void>;
  }) => React.ReactNode;
}

export function UsersExportManager({
  users,
  filterFn,
  children,
}: UsersExportManagerProps) {
  // 사용자 내보내기 처리
  const handleUsersExport = async (options: UsersExportOptions) => {
    // 필터링된 사용자에서 내보내기 옵션에 따라 데이터 생성
    let exportUsers = users.filter(filterFn);

    // 추가 필터링
    if (options.roleFilter !== "all") {
      exportUsers = exportUsers.filter(
        (user) => user.account_type === options.roleFilter
      );
    }
    if (options.statusFilter !== "all") {
      if (options.statusFilter === "active") {
        exportUsers = exportUsers.filter((user) => user.is_active);
      } else if (options.statusFilter === "inactive") {
        exportUsers = exportUsers.filter((user) => !user.is_active);
      }
    }

    // CSV 데이터 생성
    const csvData = (exportUsers || []).map((user) => {
      const row: Record<string, any> = {};

      if (options.includeBasic) {
        row[LABELS.NAME] = user.name || LABELS.NO_DATA_CSV;
        row[LABELS.EMAIL_CSV] = user.email || LABELS.NO_DATA_CSV;
        row[LABELS.REGISTRATION_DATE_USER] = formatDateTime(user.created_at);
      }

      if (options.includeContact) {
        row[LABELS.PHONE_NUMBER_CSV] = user.phone || LABELS.NO_DATA_CSV;
        row[LABELS.COMPANY_ADDRESS_CSV] =
          user.company_address || LABELS.NO_DATA_CSV;
      }

      if (options.includeActivity) {
        row[LABELS.LAST_LOGIN_CSV] = user.last_login_at
          ? formatDateTime(user.last_login_at)
          : LABELS.NO_DATA_CSV;
        row[LABELS.STATUS_CSV] = user.is_active
          ? LABELS.ACTIVE_CSV
          : LABELS.INACTIVE_CSV;
      }

      if (options.includeFarms) {
        row[LABELS.ACCOUNT_TYPE_CSV] = user.account_type || LABELS.NO_DATA_CSV;
        // farm_members 정보를 활용하여 농장 정보 추가
        const farmNames =
          user.farm_members
            ?.map((member) => member.farms?.farm_name)
            .filter(Boolean)
            .join(", ") || LABELS.NO_DATA_CSV;
        row[LABELS.AFFILIATED_FARMS] = farmNames;
      }

      if (options.includePermissions) {
        row[LABELS.PERMISSION_LEVEL] = user.account_type || LABELS.NO_DATA_CSV;
        row[LABELS.IS_ADMIN] =
          user.account_type === "admin" ? LABELS.YES_CSV : LABELS.NO_CSV;
      }

      return row;
    });

    downloadAdvancedCSV(csvData, {
      filename: "users",
      includeDate: true,
      includeBOM: true,
    });
  };

  return (
    <>
      {children({
        handleUsersExport,
      })}
    </>
  );
}
