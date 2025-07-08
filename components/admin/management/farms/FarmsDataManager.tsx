import { useAdminFarmsListQuery } from "@/lib/hooks/query/use-admin-farms-query";
import type { ExtendedFarm } from "./types";

interface FarmsDataManagerProps {
  children: (data: {
    farms: ExtendedFarm[];
    lastUpdate: Date;
    isFetching: boolean;
    setFarms: React.Dispatch<React.SetStateAction<ExtendedFarm[]>>;
    setLastUpdate: (date: Date) => void;
    setIsFetching: (fetching: boolean) => void;
    error: Error | null;
    refetch: () => void;
  }) => React.ReactNode;
}

export function FarmsDataManager({ children }: FarmsDataManagerProps) {
  const {
    data: farms = [],
    isLoading: isFetching,
    error,
    refetch,
    dataUpdatedAt,
  } = useAdminFarmsListQuery();

  return (
    <>
      {children({
        farms,
        lastUpdate: new Date(dataUpdatedAt),
        isFetching,
        setFarms: () => {}, // React Query를 사용하므로 직접 state 변경 불필요
        setLastUpdate: () => {}, // React Query를 사용하므로 직접 state 변경 불필요
        setIsFetching: () => {}, // React Query를 사용하므로 직접 state 변경 불필요
        error,
        refetch,
      })}
    </>
  );
}
