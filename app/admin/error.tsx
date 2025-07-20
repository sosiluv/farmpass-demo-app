"use client";

import { AdminError } from "@/components/error/admin-error";
import { ERROR_CONFIGS } from "@/lib/constants/error";

interface AdminErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminErrorPage({ error, reset }: AdminErrorPageProps) {
  return (
    <AdminError
      error={error}
      reset={reset}
      title={ERROR_CONFIGS.GENERAL.title}
      description={ERROR_CONFIGS.GENERAL.description}
      showNavigation={true}
    />
  );
}
