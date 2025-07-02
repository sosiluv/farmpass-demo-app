"use client";

import { AccountTabs } from "@/components/admin/account/account-tabs";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { CardSkeleton } from "@/components/common/skeletons";

export default function AccountPage() {
  const { state } = useAuth();

  if (state.status !== "authenticated") {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-2 md:pt-4">
        <CardSkeleton
          count={3}
          className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        />
      </div>
    );
  }

  const { profile, user } = state;

  return (
    <ErrorBoundary
      title="계정 관리 페이지 오류"
      description="계정 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-2 md:pt-4">
        <PageHeader
          title="계정 관리"
          description="개인 정보 및 회사 정보를 관리하세요"
          breadcrumbs={[{ label: "계정 관리" }]}
        />

        <AccountTabs profile={profile} userId={user.id} />
      </div>
    </ErrorBoundary>
  );
}
