"use client";

import React from "react";
import { useFarms } from "@/lib/hooks/use-farms";
import { useFarmsRQ } from "@/lib/hooks/query/use-farms-query";
import { useFarmMembersPreview } from "@/lib/hooks/use-farm-members-preview-safe";
import { useFarmMembersPreviewRQ } from "@/lib/hooks/query/use-farm-members-query";

interface ComparisonProps {
  userId?: string;
  testFarmIds?: string[];
}

/**
 * Farms & Members Hook 비교 컴포넌트
 * React Query 마이그레이션 테스트용
 */
export function FarmsHookComparison({
  userId,
  testFarmIds = [
    "3d5f33f1-cff9-4a18-970b-6edaca7c61e6",
    "66631990-062a-472d-9dc3-d2fc24abedd3",
    "69ae438a-b970-470d-bada-92404b0ba5e9",
  ],
}: ComparisonProps) {
  const [lastFetchTime, setLastFetchTime] = React.useState<{
    farms: string | null;
    members: string | null;
  }>({ farms: null, members: null });

  // 기존 Hook들
  const oldFarmsHook = useFarms(userId);
  const oldMembersHook = useFarmMembersPreview(testFarmIds);

  // 새로운 React Query Hook들
  const newFarmsHook = useFarmsRQ(userId);
  const newMembersHook = useFarmMembersPreviewRQ(testFarmIds);

  // 테스트용 농장 ID 추출
  const displayFarmIds = React.useMemo(() => {
    if (testFarmIds.length > 0) return testFarmIds;
    const farms = newFarmsHook.farms.slice(0, 3); // 최대 3개만
    return farms.map((f) => f.id);
  }, [testFarmIds, newFarmsHook.farms]);

  // 수동 Refetch 함수들
  const handleFarmsRefetch = async () => {
    setLastFetchTime((prev) => ({
      ...prev,
      farms: new Date().toLocaleTimeString(),
    }));
    await newFarmsHook.refetch();
  };

  const handleMembersRefetch = async () => {
    setLastFetchTime((prev) => ({
      ...prev,
      members: new Date().toLocaleTimeString(),
    }));
    await newMembersHook.refetch();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Farms & Members Hook 비교 테스트</h1>

      {/* 농장 Hook 비교 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 기존 Farms Hook */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-blue-600">
            기존 Farms Hook (Zustand)
          </h2>

          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  oldFarmsHook.fetchState.loading
                    ? "bg-yellow-400 animate-pulse"
                    : oldFarmsHook.fetchState.error
                    ? "bg-red-400"
                    : "bg-green-400"
                }`}
              ></div>
              <span className="text-sm font-medium">
                {oldFarmsHook.fetchState.loading
                  ? "로딩 중..."
                  : oldFarmsHook.fetchState.error
                  ? "에러"
                  : "완료"}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <strong>농장 수:</strong> {oldFarmsHook.farms?.length || 0}
            </div>
            <div>
              <strong>에러:</strong>{" "}
              {oldFarmsHook.fetchState.error?.message || "없음"}
            </div>
          </div>

          {oldFarmsHook.farms?.slice(0, 3).map((farm, index) => (
            <div key={index} className="text-xs p-2 border-b">
              {farm.farm_name} - {farm.farm_address}
            </div>
          ))}
        </div>

        {/* 새로운 Farms Hook */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-green-600">
            새로운 Farms Hook (React Query)
          </h2>

          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  newFarmsHook.isLoading
                    ? "bg-yellow-400 animate-pulse"
                    : newFarmsHook.isError
                    ? "bg-red-400"
                    : "bg-green-400"
                }`}
              ></div>
              <span className="text-sm font-medium">
                {newFarmsHook.isLoading
                  ? "로딩 중..."
                  : newFarmsHook.isError
                  ? "에러"
                  : "완료"}
              </span>
            </div>
            {lastFetchTime.farms && (
              <div className="text-xs text-gray-600">
                마지막 Fetch: {lastFetchTime.farms}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              React Query 캐시: {newFarmsHook.isLoading ? "Fetching" : "Cached"}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <strong>농장 수:</strong> {newFarmsHook.farms?.length || 0}
            </div>
            {newFarmsHook.isError && (
              <div className="text-red-600 text-xs">
                <strong>에러:</strong>{" "}
                {newFarmsHook.error?.message || "Unknown error"}
              </div>
            )}
          </div>

          {newFarmsHook.farms?.slice(0, 3).map((farm, index) => (
            <div key={index} className="text-xs p-2 border-b">
              {farm.farm_name} - {farm.farm_address}
            </div>
          ))}
        </div>
      </div>

      {/* 농장 멤버 Hook 비교 */}
      {displayFarmIds.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 기존 Members Hook */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">
              기존 Members Hook (기존 방식)
            </h2>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    oldMembersHook.loading
                      ? "bg-yellow-400 animate-pulse"
                      : "bg-green-400"
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {oldMembersHook.loading ? "로딩 중..." : "완료"}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <strong>조회 농장:</strong> {displayFarmIds.length}개
              </div>
              <div>
                <strong>로딩:</strong>{" "}
                {oldMembersHook.loading ? "true" : "false"}
              </div>
              {displayFarmIds.map((farmId) => {
                const memberData = oldMembersHook.getMembersForFarm(farmId);
                return (
                  <div key={farmId} className="ml-4">
                    <strong>{farmId.slice(0, 8)}...:</strong>{" "}
                    {memberData.count || 0}명
                    {memberData.error && (
                      <span className="text-red-500 ml-2">
                        (에러: {memberData.error.message})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 새로운 Members Hook */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-green-600">
              새로운 Members Hook (React Query)
            </h2>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    newMembersHook.isLoading
                      ? "bg-yellow-400 animate-pulse"
                      : newMembersHook.isError
                      ? "bg-red-400"
                      : "bg-green-400"
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {newMembersHook.isLoading
                    ? "로딩 중..."
                    : newMembersHook.isError
                    ? "에러"
                    : "완료"}
                </span>
              </div>
              {lastFetchTime.members && (
                <div className="text-xs text-gray-600">
                  마지막 Fetch: {lastFetchTime.members}
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <strong>조회 농장:</strong> {displayFarmIds.length}개
              </div>
              <div>
                <strong>에러:</strong>{" "}
                {newMembersHook.isError ? "에러 발생" : "없음"}
              </div>
              {newMembersHook.isError && (
                <div className="text-red-600 text-xs mt-1">
                  <strong>에러 내용:</strong>{" "}
                  {newMembersHook.error?.message || "Unknown error"}
                </div>
              )}
              {displayFarmIds.map((farmId) => (
                <div key={farmId} className="ml-4">
                  <strong>{farmId.slice(0, 8)}...:</strong>{" "}
                  {newMembersHook.farmMembers[farmId]?.count || 0}명
                  {newMembersHook.farmMembers[farmId]?.error && (
                    <span className="text-red-500 ml-2">(에러)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={handleFarmsRefetch}
          disabled={newFarmsHook.isLoading}
          className={`px-4 py-2 rounded transition-colors ${
            newFarmsHook.isLoading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {newFarmsHook.isLoading ? "로딩 중..." : "Farms Refetch"}
        </button>

        {displayFarmIds.length > 0 && (
          <button
            onClick={handleMembersRefetch}
            disabled={newMembersHook.isLoading}
            className={`px-4 py-2 rounded transition-colors ${
              newMembersHook.isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-purple-500 text-white hover:bg-purple-600"
            }`}
          >
            {newMembersHook.isLoading ? "로딩 중..." : "Members Refetch"}
          </button>
        )}
      </div>

      {/* 테스트 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">📝 테스트 방법</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. 농장 목록과 멤버 수 비교</li>
          <li>2. 각 Refetch 버튼으로 개별 테스트</li>
          <li>3. DevTools에서 쿼리 캐싱 상태 확인</li>
          <li>4. 네트워크 탭에서 API 호출 최적화 확인</li>
        </ol>
      </div>
    </div>
  );
}
