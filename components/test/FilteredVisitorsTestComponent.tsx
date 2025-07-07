"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useFarmVisitorsWithFiltersQuery,
  useVisitorPurposeOptionsQuery,
  type VisitorFilters,
} from "@/lib/hooks/query/use-farm-visitors-filtered-query";
import { useFarmsQuery } from "@/lib/hooks/query/use-farms-query";
import {
  Search,
  Filter,
  RotateCcw,
  Calendar,
  MapPin,
  Phone,
  User,
} from "lucide-react";

export function FilteredVisitorsTestComponent() {
  const [filters, setFilters] = useState<VisitorFilters>({
    farmId: null,
    searchTerm: "",
    dateStart: "",
    dateEnd: "",
  });

  // Query Hooks
  const { farms } = useFarmsQuery();
  const visitorsQuery = useFarmVisitorsWithFiltersQuery(filters);
  const purposeOptionsQuery = useVisitorPurposeOptionsQuery(filters.farmId);

  // 필터 업데이트 함수
  const updateFilter = (key: keyof VisitorFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 필터 리셋
  const resetFilters = () => {
    setFilters({
      farmId: null,
      searchTerm: "",
      dateStart: "",
      dateEnd: "",
    });
  };

  // 활성 필터 개수
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== null && value !== undefined && value !== ""
  ).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">방문자 필터링 테스트</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">React Query 필터링</Badge>
          <Badge variant={activeFiltersCount > 0 ? "default" : "secondary"}>
            활성 필터: {activeFiltersCount}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 필터 컨트롤 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                필터 설정
              </CardTitle>
              <CardDescription>방문자 데이터를 필터링합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 농장 선택 */}
              <div className="space-y-2">
                <Label>농장 선택</Label>
                <Select
                  value={filters.farmId || "all"}
                  onValueChange={(value) =>
                    updateFilter("farmId", value === "all" ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="농장을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 농장</SelectItem>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id}>
                        {farm.farm_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 검색어 */}
              <div className="space-y-2">
                <Label>검색어</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    className="pl-10"
                    value={filters.searchTerm || ""}
                    onChange={(e) => updateFilter("searchTerm", e.target.value)}
                    placeholder="이름, 연락처, 주소 검색"
                  />
                </div>
              </div>

              {/* 날짜 범위 */}
              <div className="space-y-2">
                <Label>시작 날짜</Label>
                <Input
                  type="date"
                  value={filters.dateStart || ""}
                  onChange={(e) => updateFilter("dateStart", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>종료 날짜</Label>
                <Input
                  type="date"
                  value={filters.dateEnd || ""}
                  onChange={(e) => updateFilter("dateEnd", e.target.value)}
                />
              </div>

              {/* 리셋 버튼 */}
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full"
                disabled={activeFiltersCount === 0}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                필터 초기화
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 결과 표시 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">총 방문자</p>
                    <p className="text-2xl font-bold">
                      {visitorsQuery.visitors.length}
                    </p>
                  </div>
                  <User className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">방역 실시율</p>
                    <p className="text-2xl font-bold">
                      {visitorsQuery.visitors.length > 0
                        ? Math.round(
                            (visitorsQuery.visitors.filter(
                              (v) => v.disinfection_check
                            ).length /
                              visitorsQuery.visitors.length) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-green-600">
                    방역
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">정보 동의율</p>
                    <p className="text-2xl font-bold">
                      {visitorsQuery.visitors.length > 0
                        ? Math.round(
                            (visitorsQuery.visitors.filter(
                              (v) => v.consent_given
                            ).length /
                              visitorsQuery.visitors.length) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-blue-600">
                    동의
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 상태 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>쿼리 상태</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>로딩 상태:</span>
                <Badge
                  variant={
                    visitorsQuery.isLoading ? "destructive" : "secondary"
                  }
                >
                  {visitorsQuery.isLoading ? "로딩 중" : "완료"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>데이터 가져오는 중:</span>
                <Badge
                  variant={
                    visitorsQuery.isFetching ? "destructive" : "secondary"
                  }
                >
                  {visitorsQuery.isFetching ? "페칭 중" : "대기 중"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>데이터 상태:</span>
                <Badge variant={visitorsQuery.isStale ? "outline" : "default"}>
                  {visitorsQuery.isStale ? "오래됨" : "최신"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>마지막 업데이트:</span>
                <span className="text-sm text-gray-600">
                  {visitorsQuery.dataUpdatedAt
                    ? new Date(visitorsQuery.dataUpdatedAt).toLocaleString()
                    : "없음"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 방문자 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>방문자 목록</CardTitle>
              <CardDescription>
                필터링된 방문자 {visitorsQuery.visitors.length}명
              </CardDescription>
            </CardHeader>
            <CardContent>
              {visitorsQuery.isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
                </div>
              ) : visitorsQuery.visitors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    조건에 맞는 방문자가 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {visitorsQuery.visitors.slice(0, 20).map((visitor) => (
                    <div key={visitor.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {visitor.visitor_name}
                          </span>
                          <Badge
                            variant={
                              visitor.disinfection_check ? "default" : "outline"
                            }
                          >
                            {visitor.disinfection_check
                              ? "방역 완료"
                              : "방역 미실시"}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-600">
                          {new Date(
                            visitor.visit_datetime
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {visitor.visitor_phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {visitor.visitor_address}
                        </div>
                        {visitor.visitor_purpose && (
                          <Badge variant="outline" className="text-xs">
                            {visitor.visitor_purpose}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {visitorsQuery.visitors.length > 20 && (
                    <p className="text-center text-gray-600 py-2">
                      ... 외 {visitorsQuery.visitors.length - 20}명 더
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
