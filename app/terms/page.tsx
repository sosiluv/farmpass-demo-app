"use client";

import { TermsPageWrapper } from "@/components/common/TermsPageWrapper";

export default function TermsPage() {
  return (
    <TermsPageWrapper
      termType="terms"
      errorMessage="서비스 이용약관을 불러올 수 없습니다."
      title="서비스 이용약관"
    />
  );
}
