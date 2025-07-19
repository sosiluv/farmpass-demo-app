import { downloadAdvancedCSV } from "@/lib/utils/data/csv-unified";
import { formatDateTime } from "@/lib/utils/datetime/date";
import type { Profile } from "@/lib/types";
import type { UsersExportOptions } from "../exports";

interface UsersExportManagerProps {
  users: Profile[];
  filterFn: (user: Profile) => boolean;
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
        row["이름"] = user.name || "-";
        row["이메일"] = user.email || "-";
        row["가입일"] = formatDateTime(user.created_at);
      }

      if (options.includeContact) {
        row["전화번호"] = user.phone || "-";
        row["회사주소"] = user.company_address || "-";
      }

      if (options.includeActivity) {
        row["마지막로그인"] = user.last_login_at
          ? formatDateTime(user.last_login_at)
          : "-";
        row["상태"] = user.is_active ? "활성" : "비활성";
      }

      if (options.includeFarms) {
        row["계정유형"] = user.account_type || "-";
        // 농장 정보는 추가 쿼리가 필요하므로 기본값으로 설정
        row["소속농장"] = "-";
      }

      if (options.includePermissions) {
        row["권한레벨"] = user.account_type || "-";
        row["관리자여부"] = user.account_type === "admin" ? "예" : "아니오";
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
