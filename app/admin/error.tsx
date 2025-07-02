"use client";

import { AdminError } from "@/components/error/admin-error";

interface AdminErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminErrorPage({ error, reset }: AdminErrorPageProps) {
  return (
    <AdminError
      error={error}
      reset={reset}
      title="페이지 오류"
      description="페이지를 불러오는 중 문제가 발생했습니다."
      showNavigation={true}
    />
  );
}
