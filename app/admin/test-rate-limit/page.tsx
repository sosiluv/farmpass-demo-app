"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AccessDenied } from "@/components/error/access-denied";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export default function TestRateLimitPage() {
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;

  const [isLoading, setIsLoading] = useState(false);
  const [isProduction, setIsProduction] = useState(false);
  const [results, setResults] = useState<
    Array<{
      id: number;
      success: boolean;
      status: number;
      message: string;
      timestamp: string;
    }>
  >([]);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    limit?: string;
    remaining?: string;
    reset?: string;
  }>({});

  // 환경 확인
  useEffect(() => {
    setIsProduction(process.env.NODE_ENV === "production");
  }, []);

  // 관리자 권한 체크
  if (!profile || profile.account_type !== "admin") {
    return (
      <AccessDenied
        title="관리자 전용"
        description="이 페이지는 관리자만 접근할 수 있습니다."
        showNavigation={true}
      />
    );
  }

  // 프로덕션 환경에서 접근 제한
  if (isProduction) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center max-w-lg mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              접근 제한됨
            </h1>
            <p className="text-slate-500">
              이 페이지는 프로덕션 환경에서 보안상 비활성화되어 있습니다.
              <br />
              개발 환경에서만 Rate Limiting 테스트가 가능합니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 개발 환경에서만 표시되는 경고
  const showDevWarning = process.env.NODE_ENV === "development";

  const testApiCall = async () => {
    setIsLoading(true);
    const id = Date.now();

    try {
      const response = await fetch("/api/health", {
        method: "GET",
      });

      const data = await response.json();

      // Rate limit 헤더 정보 추출
      const limit = response.headers.get("X-RateLimit-Limit");
      const remaining = response.headers.get("X-RateLimit-Remaining");
      const reset = response.headers.get("X-RateLimit-Reset");

      setRateLimitInfo({
        limit: limit || undefined,
        remaining: remaining || undefined,
        reset: reset || undefined,
      });

      setResults((prev) => [
        ...prev,
        {
          id,
          success: response.ok,
          status: response.status,
          message: response.ok ? "성공" : data.error || "실패",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      setResults((prev) => [
        ...prev,
        {
          id,
          success: false,
          status: 0,
          message: error instanceof Error ? error.message : "네트워크 오류",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setRateLimitInfo({});
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: number) => {
    if (status === 429) {
      return <Badge variant="destructive">Rate Limit</Badge>;
    } else if (status >= 200 && status < 300) {
      return <Badge variant="default">Success</Badge>;
    } else {
      return <Badge variant="secondary">Error</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Rate Limit 테스트
          </h1>
          <p className="text-slate-600 mt-2">
            API 요청 제한 기능을 테스트할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/admin/test-errors", "_blank")}
          >
            에러 테스트
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/admin/test-push", "_blank")}
          >
            푸시 테스트
          </Button>
        </div>
        <Button onClick={clearResults} variant="outline">
          결과 초기화
        </Button>
      </div>

      {showDevWarning && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>개발 환경 전용:</strong> 이 페이지는 개발 및 테스트
            목적으로만 사용됩니다. 프로덕션 환경에서는 자동으로 비활성화됩니다.
          </AlertDescription>
        </Alert>
      )}

      {/* Rate Limit 정보 */}
      {(rateLimitInfo.limit || rateLimitInfo.remaining) && (
        <Card>
          <CardHeader>
            <CardTitle>Rate Limit 상태</CardTitle>
            <CardDescription>현재 API 요청 제한 상태입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-sm font-medium">제한:</span>
                <Badge variant="outline" className="ml-2">
                  {rateLimitInfo.limit || "N/A"}
                </Badge>
              </div>
              <div>
                <span className="text-sm font-medium">남은 요청:</span>
                <Badge
                  variant={
                    parseInt(rateLimitInfo.remaining || "0") < 10
                      ? "destructive"
                      : "outline"
                  }
                  className="ml-2"
                >
                  {rateLimitInfo.remaining || "N/A"}
                </Badge>
              </div>
              {rateLimitInfo.reset && (
                <div>
                  <span className="text-sm font-medium">초기화:</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {new Date(rateLimitInfo.reset).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 테스트 컨트롤 */}
      <Card>
        <CardHeader>
          <CardTitle>API 요청 테스트</CardTitle>
          <CardDescription>
            버튼을 클릭하여 API 요청을 보내고 Rate Limiting을 테스트합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button onClick={testApiCall} disabled={isLoading} className="w-32">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  요청 중...
                </>
              ) : (
                "API 호출"
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              현재 설정: IP당 90초에 100회 요청 제한
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결과 목록 */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>테스트 결과</CardTitle>
            <CardDescription>
              총 {results.length}개의 요청 결과입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.success)}
                    <div>
                      <div className="font-medium">{result.message}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.timestamp}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(result.status)}
                    <span className="text-sm text-muted-foreground">
                      {result.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rate Limit 초과 경고 */}
      {results.some((r) => r.status === 429) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Rate Limit에 도달했습니다! 90초 후에 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
