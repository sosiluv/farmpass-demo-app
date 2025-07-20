"use client";

import { AccountTabs } from "@/components/admin/account/account-tabs";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { CardSkeleton } from "@/components/common/skeletons";
import { PAGE_HEADER } from "@/lib/constants/account";
import { ERROR_CONFIGS } from "@/lib/constants/error";

export default function AccountPage() {
  const { state } = useAuth();

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-2 md:pt-4">
        <PageHeader
          title={PAGE_HEADER.PAGE_TITLE}
          description={PAGE_HEADER.PAGE_DESCRIPTION}
          breadcrumbs={[{ label: PAGE_HEADER.BREADCRUMB }]}
        />

        {state.status !== "authenticated" ? (
          <CardSkeleton
            count={3}
            className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          />
        ) : (
          <AccountTabs profile={state.profile} userId={state.user.id} />
        )}
      </div>
    </ErrorBoundary>
  );
}
