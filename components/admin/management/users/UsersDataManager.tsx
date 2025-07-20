import { useAdminUsersListQuery } from "@/lib/hooks/query/use-admin-users-query";
import type { Profile } from "@/lib/types";

interface UsersDataManagerProps {
  children: (data: {
    users: Profile[];
    lastUpdate: Date;
    setUsers: React.Dispatch<React.SetStateAction<Profile[]>>;
    setLastUpdate: (date: Date) => void;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  }) => React.ReactNode;
}

export function UsersDataManager({ children }: UsersDataManagerProps) {
  const {
    data: users = [],
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useAdminUsersListQuery();

  return (
    <>
      {children({
        users,
        lastUpdate: new Date(dataUpdatedAt),
        setUsers: () => {}, // React Query를 사용하므로 직접 state 변경 불필요
        setLastUpdate: () => {}, // React Query를 사용하므로 직접 state 변경 불필요
        isLoading,
        error,
        refetch,
      })}
    </>
  );
}
