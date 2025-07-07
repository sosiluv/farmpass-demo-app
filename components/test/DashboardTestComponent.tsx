"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Search, Building2, RefreshCcw } from "lucide-react";

import { useFarmVisitorsWithFiltersQuery } from "@/lib/hooks/query/use-farm-visitors-filtered-query";
import { useFarms } from "@/lib/hooks/use-farms";
import { useAuth } from "@/components/providers/auth-provider";
import type { Farm } from "@/lib/types";

/**
 * 통계 대시보드 테스트 컴포넌트
 * 농장 선택 시 통계가 실시간으로 업데이트되는지 확인
 */
export function DashboardTestComponent() {
  const [selectedFarmId, setSelectedFarmId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");

  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;

  // 농장 목록 조회
  const farmsQuery = useFarms(user?.id);
  const farms: Farm[] = farmsQuery.farms || [];

  // 방문자 데이터 조회 (필터 적용)
  const visitorsQuery = useFarmVisitorsWithFiltersQuery({
    farmId: selectedFarmId === "all" ? null : selectedFarmId,
    searchTerm,
    dateRange,
  });

  const {
    visitors,
    allVisitors,
    dashboardStats,
    loading,
    error,
    refetch,
    isFetching,
  } = visitorsQuery;

  // 농장 선택 핸들러
  const handleFarmChange = (farmId: string) => {
    console.log(`🏠 농장 변경: ${farmId}`);
    setSelectedFarmId(farmId);
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    console.log("🔄 수동 새로고침");
    refetch();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">데이터 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">에러: {error.message}</div>
      </div>
    );
  }

  const selectedFarm = farms.find((f: Farm) => f.id === selectedFarmId);

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">통계 대시보드 테스트</h1>
          <p className="text-gray-600">
            농장 선택 시 통계가 실시간으로 업데이트되는지 확인
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {isFetching ? "업데이트 중..." : "최신"}
          </Badge>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCcw
              className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            새로고침
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>필터 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 농장 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                농장 선택
              </label>
              <Select value={selectedFarmId} onValueChange={handleFarmChange}>
                <SelectTrigger>
                  <SelectValue placeholder="농장을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>전체 농장</span>
                    </div>
                  </SelectItem>
                  {farms.map((farm: Farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>{farm.farm_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 검색어 */}
            <div>
              <label className="block text-sm font-medium mb-2">검색어</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름, 연락처, 주소 검색..."
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            {/* 날짜 범위 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                날짜 범위
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 기간</SelectItem>
                  <SelectItem value="today">오늘</SelectItem>
                  <SelectItem value="week">일주일</SelectItem>
                  <SelectItem value="month">한달</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 현재 상태 표시 */}
      <Card>
        <CardHeader>
          <CardTitle>현재 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">선택된 농장:</span>
              <div className="text-blue-600 font-bold">
                {selectedFarm ? selectedFarm.farm_name : "전체 농장"}
              </div>
            </div>
            <div>
              <span className="font-medium">전체 데이터:</span>
              <div className="text-green-600 font-bold">
                {allVisitors.length}건
              </div>
            </div>
            <div>
              <span className="font-medium">필터링된 데이터:</span>
              <div className="text-orange-600 font-bold">
                {visitors.length}건
              </div>
            </div>
            <div>
              <span className="font-medium">로딩 상태:</span>
              <div className="text-purple-600 font-bold">
                {isFetching ? "업데이트 중" : "완료"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 방문자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.totalVisitors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.trends?.totalVisitorsTrend || "데이터 없음"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 방문자</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.todayVisitors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.trends?.todayVisitorsTrend || "데이터 없음"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주간 방문자</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.weeklyVisitors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.trends?.weeklyVisitorsTrend || "데이터 없음"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">방역 실시율</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.disinfectionRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.trends?.disinfectionTrend || "데이터 없음"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 디버그 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>디버그 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                쿼리 키:
              </span>
              <span className="ml-2 font-mono text-xs">
                {JSON.stringify(
                  visitorsQuery.dataUpdatedAt ? "캐시됨" : "없음"
                )}
              </span>
            </div>
            <div>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                마지막 업데이트:
              </span>
              <span className="ml-2 font-mono text-xs">
                {visitorsQuery.dataUpdatedAt
                  ? new Date(visitorsQuery.dataUpdatedAt).toLocaleString()
                  : "없음"}
              </span>
            </div>
            <div>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                필터 상태:
              </span>
              <span className="ml-2 font-mono text-xs">
                {JSON.stringify({
                  farmId: selectedFarmId,
                  searchTerm,
                  dateRange,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
