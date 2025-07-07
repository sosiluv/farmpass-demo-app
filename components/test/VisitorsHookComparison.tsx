"use client";

import React from "react";
import { useFarmVisitors } from "@/lib/hooks/use-farm-visitors";
import { useFarmVisitorsRQ } from "@/lib/hooks/query/use-farm-visitors-query";

interface ComparisonProps {
  farmId: string | null;
}

/**
 * 기존 Hook vs React Query Hook 비교 컴포넌트
 * 점진적 마이그레이션을 위한 테스트 페이지
 */
export function VisitorsHookComparison({ farmId }: ComparisonProps) {
  const [lastFetchTime, setLastFetchTime] = React.useState<{
    old: string | null;
    new: string | null;
  }>({ old: null, new: null });

  // 기존 Hook
  const oldHook = useFarmVisitors(farmId);

  // 새로운 React Query Hook
  const newHook = useFarmVisitorsRQ(farmId);

  // 환경변수로 어떤 Hook을 사용할지 결정
  const useReactQuery = process.env.NEXT_PUBLIC_USE_REACT_QUERY === "true";

  // 수동 Refetch 함수들
  const handleOldRefetch = async () => {
    setLastFetchTime((prev) => ({
      ...prev,
      old: new Date().toLocaleTimeString(),
    }));
    await oldHook.refetch();
  };

  const handleNewRefetch = async () => {
    setLastFetchTime((prev) => ({
      ...prev,
      new: new Date().toLocaleTimeString(),
    }));
    await newHook.refetch();
  };

  // 실시간 업데이트 시뮬레이션 (개발용)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(false);

  React.useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      console.log("🔄 Auto refresh triggered");
      newHook.refetch();
    }, 10000); // 10초마다 자동 갱신

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, newHook]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Visitors Hook 비교 테스트</h1>

      {/* 현재 사용 중인 Hook 표시 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">현재 사용 중</h2>
        <p className="text-sm">
          {useReactQuery ? "React Query Hook" : "기존 Zustand Hook"}
        </p>
        <p className="text-xs text-gray-600">
          환경변수 NEXT_PUBLIC_USE_REACT_QUERY로 제어
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 기존 Hook 결과 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-blue-600">
            기존 Hook (Zustand)
          </h2>

          {/* 상태 정보 */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  oldHook.loading
                    ? "bg-yellow-400 animate-pulse"
                    : "bg-green-400"
                }`}
              ></div>
              <span className="text-sm font-medium">
                {oldHook.loading ? "로딩 중..." : "완료"}
              </span>
            </div>
            {lastFetchTime.old && (
              <div className="text-xs text-gray-600">
                마지막 Fetch: {lastFetchTime.old}
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <strong>방문자 수:</strong> {oldHook.visitors?.length || 0}
            </div>
            <div>
              <strong>오늘 방문자:</strong>{" "}
              {oldHook.dashboardStats?.todayVisitors || 0}
            </div>
            <div>
              <strong>전체 방문자:</strong>{" "}
              {oldHook.dashboardStats?.totalVisitors || 0}
            </div>
            <div>
              <strong>통계 데이터:</strong>
              <ul className="ml-4 mt-1">
                <li>목적별: {oldHook.purposeStats?.length || 0}개</li>
                <li>요일별: {oldHook.weekdayStats?.length || 0}개</li>
                <li>재방문: {oldHook.revisitStats?.length || 0}개</li>
                <li>트렌드: {oldHook.visitorTrend?.length || 0}개</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 새로운 Hook 결과 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-green-600">
            새로운 Hook (React Query)
          </h2>

          {/* 상태 정보 */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  newHook.isLoading
                    ? "bg-yellow-400 animate-pulse"
                    : newHook.isError
                    ? "bg-red-400"
                    : "bg-green-400"
                }`}
              ></div>
              <span className="text-sm font-medium">
                {newHook.isLoading
                  ? "로딩 중..."
                  : newHook.isError
                  ? "에러"
                  : "완료"}
              </span>
            </div>
            {lastFetchTime.new && (
              <div className="text-xs text-gray-600">
                마지막 Fetch: {lastFetchTime.new}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              React Query 캐시: {newHook.isLoading ? "Fetching" : "Cached"}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <strong>방문자 수:</strong> {newHook.visitors?.length || 0}
            </div>
            <div>
              <strong>오늘 방문자:</strong>{" "}
              {newHook.dashboardStats?.todayVisitors || 0}
            </div>
            <div>
              <strong>전체 방문자:</strong>{" "}
              {newHook.dashboardStats?.totalVisitors || 0}
            </div>
            <div>
              <strong>통계 데이터:</strong>
              <ul className="ml-4 mt-1">
                <li>목적별: {newHook.purposeStats?.length || 0}개</li>
                <li>요일별: {newHook.weekdayStats?.length || 0}개</li>
                <li>재방문: {newHook.revisitStats?.length || 0}개</li>
                <li>트렌드: {newHook.visitorTrend?.length || 0}개</li>
              </ul>
            </div>
            {newHook.isError && (
              <div className="text-red-600 text-xs mt-2">
                <strong>에러:</strong>{" "}
                {newHook.error?.message || "Unknown error"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={handleOldRefetch}
            disabled={oldHook.loading}
            className={`px-4 py-2 rounded transition-colors ${
              oldHook.loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {oldHook.loading ? "로딩 중..." : "기존 Hook Refetch"}
          </button>
          <button
            onClick={handleNewRefetch}
            disabled={newHook.isLoading}
            className={`px-4 py-2 rounded transition-colors ${
              newHook.isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {newHook.isLoading ? "로딩 중..." : "React Query Refetch"}
          </button>
        </div>

        {/* Refetch 테스트 안내 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            📝 Refetch 테스트 방법
          </h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. 각 버튼을 클릭하여 로딩 상태 확인</li>
            <li>2. 마지막 Fetch 시간이 업데이트되는지 확인</li>
            <li>
              3. React Query는 캐시된 데이터를 먼저 보여준 후 백그라운드에서
              업데이트
            </li>
            <li>4. 네트워크 탭에서 실제 API 호출 확인 가능</li>
            <li>
              5. 다른 탭으로 이동 후 돌아오면 React Query가 자동으로 refetch
            </li>
          </ol>
        </div>

        {/* 자동 갱신 토글 */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">자동 갱신 (10초마다)</span>
          </label>
          <span className="text-xs text-gray-500">
            React Query 캐시 동작 테스트용
          </span>
        </div>
      </div>

      {/* 방문자 목록 비교 (첫 5개만) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">기존 Hook - 방문자 목록</h3>
          <div className="max-h-40 overflow-y-auto">
            {oldHook.visitors?.slice(0, 5).map((visitor, index) => (
              <div key={index} className="text-xs p-2 border-b">
                {visitor.visitor_name} - {visitor.visitor_purpose}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">React Query - 방문자 목록</h3>
          <div className="max-h-40 overflow-y-auto">
            {newHook.visitors?.slice(0, 5).map((visitor, index) => (
              <div key={index} className="text-xs p-2 border-b">
                {visitor.visitor_name} - {visitor.visitor_purpose}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
