"use client";

import { AccountTabs } from "@/components/admin/account/account-tabs";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { CardSkeleton } from "@/components/ui/skeleton";
import { PAGE_HEADER } from "@/lib/constants/account";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";
import { AdminError } from "@/components/error/admin-error";
import { User } from "lucide-react";

export default function AccountPage() {
  const { userId, isAuthenticated } = useAuth();
  const { data: profile, isLoading, error } = useProfileQuery(userId);

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="flex-1 space-y-4 md:space-y-6 px-4 md:px-6 lg:px-8 pt-3 pb-4 md:pb-6 lg:pb-8">
        <PageHeader
          title={PAGE_HEADER.PAGE_TITLE}
          description={PAGE_HEADER.PAGE_DESCRIPTION}
          icon={User}
        />

        {!isAuthenticated || isLoading ? (
          <CardSkeleton
            count={3}
            className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          />
        ) : error ? (
          <AdminError
            title={PAGE_HEADER.PAGE_TITLE}
            description={ERROR_CONFIGS.LOADING.description}
            error={error}
            reset={() => window.location.reload()}
          />
        ) : !profile ? (
          <CardSkeleton
            count={3}
            className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          />
        ) : (
          <AccountTabs profile={profile} />
        )}
      </div>
    </ErrorBoundary>
  );
}
