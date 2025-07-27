"use client";

import { useMemo } from "react";
import { CardSkeleton } from "@/components/common/skeletons";
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

import {
  useMonitoringHealthQuery,
  useMonitoringUptimeQuery,
  useMonitoringAnalyticsQuery,
  useMonitoringErrorsQuery,
} from "@/lib/hooks/query/use-monitoring-query";
import { PAGE_HEADER, LABELS } from "@/lib/constants/monitoring";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";

// 카드별 로딩/에러/데이터 렌더링 유틸
type RenderCardProps = {
  isLoading: boolean;
  data: any;
  children: React.ReactNode;
  skeleton: React.ReactNode;
};
function renderCard({ isLoading, data, children, skeleton }: RenderCardProps) {
  if (isLoading) return skeleton;
  if (!data) return skeleton;
  return children;
}

export default function MonitoringDashboard() {
  const health = useMonitoringHealthQuery();
  const uptime = useMonitoringUptimeQuery();
  const analytics = useMonitoringAnalyticsQuery();
  const errors = useMonitoringErrorsQuery();

  const { state } = useAuth();
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile, isLoading: profileLoading } = useProfileQuery(userId);
  const isAdmin = profile?.account_type === "admin";

  // 프로필 로딩 중일 때는 스켈레톤 표시
  if (profileLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-6 pt-2 md:pt-4">
        <PageHeader
          title={PAGE_HEADER.PAGE_TITLE}
          description={PAGE_HEADER.PAGE_DESCRIPTION}
          breadcrumbs={[{ label: PAGE_HEADER.BREADCRUMB }]}
        />
        <CardSkeleton count={5} />
      </div>
    );
  }

  // 권한이 없는 경우(기존 유지)
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

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="flex-1 space-y-6 p-4 md:p-6 pt-2 md:pt-4">
        <PageHeader
          title={PAGE_HEADER.PAGE_TITLE}
          description={PAGE_HEADER.PAGE_DESCRIPTION}
          breadcrumbs={[{ label: PAGE_HEADER.BREADCRUMB }]}
        />

        {/* 시스템 상태 카드 */}
        {renderCard({
          isLoading: health.isLoading,
          data: health.data,
          skeleton: <CardSkeleton />,
          children: <SystemStatusCard data={health.data} />,
        })}

        <div className="space-y-6">
          {/* 가동시간과 방문자 통계를 2열로 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* 업타임 카드 */}
            {renderCard({
              isLoading: uptime.isLoading,
              data: uptime.data,
              skeleton: <CardSkeleton />,
              children: (
                <UptimeCard
                  monitors={uptime.data?.monitors ?? []}
                  success={uptime.data?.success}
                  error={uptime.data?.error}
                  message={uptime.data?.message}
                  details={uptime.data?.details}
                />
              ),
            })}
            {/* 방문자 통계 카드 */}
            {renderCard({
              isLoading: analytics.isLoading,
              data: analytics.data,
              skeleton: <CardSkeleton />,
              children: <AnalyticsCard data={analytics.data} />,
            })}
          </div>

          {/* 개발 스택 정보 */}
          {health.data?.health?.system?.techStack && (
            <TechStackCard data={health.data.health.system.techStack} />
          )}

          {/* 최근 에러를 아래로 한 칸 내려서 1열로 */}
          {renderCard({
            isLoading: errors.isLoading,
            data: errors.data,
            skeleton: <CardSkeleton />,
            children: <ErrorLogsCard errors={errors.data ?? []} />,
          })}
        </div>
      </div>
    </ErrorBoundary>
  );
}
