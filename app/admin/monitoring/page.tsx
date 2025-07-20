"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatsSkeleton, CardSkeleton } from "@/components/common/skeletons";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { AccessDenied } from "@/components/error/access-denied";
import { PageHeader } from "@/components/layout";
import {
  SystemStatusCard,
  UptimeCard,
  ErrorLogsCard,
  AnalyticsCard,
  TechStackCard,
} from "@/components/admin/monitoring";
import { AdminError } from "@/components/error/admin-error";
import { useDataFetchTimeout } from "@/hooks/useTimeout";
import { useMonitoringQuery } from "@/lib/hooks/query/use-monitoring-query";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";
import { LABELS, PAGE_HEADER } from "@/lib/constants/monitoring";
import { ERROR_CONFIGS } from "@/lib/constants/error";

export default function MonitoringDashboard() {
  const { data, isLoading: loading, error, refetch } = useMonitoringQuery();

  const router = useRouter();
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;
  const isAdmin = useMemo(
    () => profile?.account_type === "admin",
    [profile?.account_type]
  );

  // 권한 체크
  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin");
    }
  }, [isAdmin, router]);

  // 타임아웃 관리
  const { timeoutReached, retry } = useDataFetchTimeout(
    loading,
    async () => {
      await refetch();
    },
    {
      timeout: 10000,
    }
  );

  // 권한이 없는 경우
  if (!isAdmin) {
    return (
      <AccessDenied
        title={ERROR_CONFIGS.PERMISSION.title}
        description={ERROR_CONFIGS.PERMISSION.description}
        requiredRole="관리자"
        currentRole="일반 사용자"
      />
    );
  }

  if (timeoutReached) {
    return (
      <AdminError
        title={ERROR_CONFIGS.TIMEOUT.title}
        description={ERROR_CONFIGS.TIMEOUT.description}
        retry={retry}
        error={new Error("Timeout: 데이터 로딩 10초 초과")}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-6 pt-2 md:pt-4">
        <PageHeader
          title={PAGE_HEADER.PAGE_TITLE}
          description={PAGE_HEADER.PAGE_DESCRIPTION}
          breadcrumbs={[{ label: PAGE_HEADER.BREADCRUMB }]}
        />
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    const authError = getAuthErrorMessage(error);
    return (
      <div className="flex-1 space-y-6 p-4 md:p-6 pt-2 md:pt-4">
        <PageHeader
          title={PAGE_HEADER.PAGE_TITLE}
          description={PAGE_HEADER.PAGE_DESCRIPTION}
          breadcrumbs={[{ label: PAGE_HEADER.BREADCRUMB }]}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{LABELS.ERROR_TITLE}</AlertTitle>
          <AlertDescription>{authError.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 pt-2 md:pt-4">
      <PageHeader
        title={PAGE_HEADER.PAGE_TITLE}
        description={PAGE_HEADER.PAGE_DESCRIPTION}
        breadcrumbs={[{ label: PAGE_HEADER.BREADCRUMB }]}
      />

      <SystemStatusCard data={data} />

      <div className="space-y-6">
        {/* 가동시간과 방문자 통계를 2열로 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.meta.uptimeConfigured && (
            <UptimeCard
              monitors={data.services.uptime?.monitors ?? []}
              success={data.services.uptime?.success}
              error={data.services.uptime?.error}
              message={data.services.uptime?.message}
              details={data.services.uptime?.details}
            />
          )}
          {data.meta.analyticsConfigured && (
            <AnalyticsCard data={data.services.analytics} />
          )}
        </div>

        {/* 개발 스택 정보 */}
        <TechStackCard data={data?.services?.health?.system?.techStack} />

        {/* 최근 에러를 아래로 한 칸 내려서 1열로 */}
        <ErrorLogsCard errors={data.services.errors ?? []} />
      </div>
    </div>
  );
}
