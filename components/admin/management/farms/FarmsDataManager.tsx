import { useState, useEffect } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { supabase } from "@/lib/supabase/client";
import type { ExtendedFarm } from "./types";

interface FarmsDataManagerProps {
  children: (data: {
    farms: ExtendedFarm[];
    lastUpdate: Date;
    isFetching: boolean;
    setFarms: React.Dispatch<React.SetStateAction<ExtendedFarm[]>>;
    setLastUpdate: (date: Date) => void;
    setIsFetching: (fetching: boolean) => void;
  }) => React.ReactNode;
}

export function FarmsDataManager({ children }: FarmsDataManagerProps) {
  const { showCustomError, showInfo } = useCommonToast();
  const [farms, setFarms] = useState<ExtendedFarm[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!isFetching) {
      fetchFarms();
    }
  }, []);

  const fetchFarms = async () => {
    // 중복 요청 방지
    if (isFetching) {
      devLog.log("Farms fetch already in progress, skipping...");
      return;
    }

    showInfo("농장 정보 로딩 시작", "농장 정보를 불러오는 중입니다...");
    try {
      setIsFetching(true);
      const { data, error } = await supabase.from("farms").select(`
          *,
          profiles!farms_owner_id_fkey(name)
        `);

      if (error) throw error;

      // 모든 농장의 구성원 수를 한 번에 조회
      const farmIds = (data || []).map((farm) => farm.id);

      let memberCounts: Record<string, number> = {};
      let visitorCounts: Record<string, number> = {};

      if (farmIds.length > 0) {
        // 구성원 수 조회 (한 번의 API 호출)
        const { data: memberData } = await supabase
          .from("farm_members")
          .select("farm_id")
          .in("farm_id", farmIds);

        // 농장별 구성원 수 계산
        memberCounts = (memberData || []).reduce((acc, member) => {
          acc[member.farm_id] = (acc[member.farm_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // 방문자 수 조회 (최근 30일)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: visitorData } = await supabase
          .from("visitor_entries")
          .select("farm_id")
          .in("farm_id", farmIds)
          .gte("visit_datetime", thirtyDaysAgo.toISOString());

        // 농장별 방문자 수 계산
        visitorCounts = (visitorData || []).reduce((acc, visitor) => {
          acc[visitor.farm_id] = (acc[visitor.farm_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      // 농장 데이터에 구성원 수와 방문자 수 추가
      const farmsWithCounts = (data || []).map((farm) => ({
        ...farm,
        owner_name: (farm as any).profiles?.name || "알 수 없음",
        member_count: memberCounts[farm.id] || 0,
        visitor_count: visitorCounts[farm.id] || 0,
      }));

      setFarms(farmsWithCounts);
      setLastUpdate(new Date());
    } catch (error: any) {
      devLog.error("Error fetching farms:", error);
      showCustomError(
        "농장 정보 불러오기 실패",
        "농장 정보를 불러오는데 실패했습니다."
      );
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <>
      {children({
        farms,
        lastUpdate,
        isFetching,
        setFarms,
        setLastUpdate,
        setIsFetching,
      })}
    </>
  );
}
