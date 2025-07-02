import { useState, useMemo } from "react";
import type { Profile } from "@/lib/types";
import type { UserFilters } from "./UserFilters";

interface UsersFilterManagerProps {
  users: Profile[];
  children: (data: {
    filters: UserFilters;
    setFilters: (filters: UserFilters) => void;
    filterFn: (user: Profile) => boolean;
    sortFn: (a: Profile, b: Profile) => number;
  }) => React.ReactNode;
}

export function UsersFilterManager({
  users,
  children,
}: UsersFilterManagerProps) {
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: "all",
    status: "all",
  });

  // 필터링 함수
  const filterFn = useMemo(() => {
    return (user: Profile) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        const phoneMatch = user.phone?.toLowerCase().includes(searchLower);
        if (!nameMatch && !emailMatch && !phoneMatch) return false;
      }

      if (filters.role !== "all" && user.account_type !== filters.role) {
        return false;
      }

      if (filters.status === "active" && !user.is_active) {
        return false;
      }

      if (filters.status === "inactive" && user.is_active) {
        return false;
      }

      return true;
    };
  }, [filters]);

  // 정렬 함수 (관리자 우선, 같은 역할 내에서는 최신 가입순)
  const sortFn = useMemo(() => {
    return (a: Profile, b: Profile) => {
      // 관리자가 일반 사용자보다 우선
      if (a.account_type === "admin" && b.account_type !== "admin") {
        return -1;
      }
      if (a.account_type !== "admin" && b.account_type === "admin") {
        return 1;
      }

      // 같은 역할 내에서는 최신 가입순
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    };
  }, []);

  return (
    <>
      {children({
        filters,
        setFilters,
        filterFn,
        sortFn,
      })}
    </>
  );
}
