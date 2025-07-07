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
  // 기존 Hook
  const oldHook = useFarmVisitors(farmId);
  
  // 새로운 React Query Hook
  const newHook = useFarmVisitorsRQ(farmId);

  // 환경변수로 어떤 Hook을 사용할지 결정
  const useReactQuery = process.env.NEXT_PUBLIC_USE_REACT_QUERY === "true";

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
          
          <div className="space-y-2 text-sm">
            <div>
              <strong>로딩:</strong> {oldHook.loading ? "true" : "false"}
            </div>
            <div>
              <strong>방문자 수:</strong> {oldHook.visitors?.length || 0}
            </div>
            <div>
              <strong>오늘 방문자:</strong> {oldHook.dashboardStats?.todayVisitors || 0}
            </div>
            <div>
              <strong>전체 방문자:</strong> {oldHook.dashboardStats?.totalVisitors || 0}
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
          
          <div className="space-y-2 text-sm">
            <div>
              <strong>로딩:</strong> {newHook.loading ? "true" : "false"}
            </div>
            <div>
              <strong>방문자 수:</strong> {newHook.visitors?.length || 0}
            </div>
            <div>
              <strong>오늘 방문자:</strong> {newHook.dashboardStats?.todayVisitors || 0}
            </div>
            <div>
              <strong>전체 방문자:</strong> {newHook.dashboardStats?.totalVisitors || 0}
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
            <div>
              <strong>캐시 상태:</strong>
              <ul className="ml-4 mt-1">
                <li>로딩: {newHook.isLoading ? "true" : "false"}</li>
                <li>에러: {newHook.isError ? "true" : "false"}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex gap-4">
        <button
          onClick={() => oldHook.refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          기존 Hook Refetch
        </button>
        <button
          onClick={() => newHook.refetch()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          React Query Refetch
        </button>
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
