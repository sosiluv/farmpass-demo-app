"use client";

import { TermsPageWrapper } from "@/components/common/TermsPageWrapper";

export default function PrivacyPage() {
  return (
    <TermsPageWrapper
      termType="privacy"
      errorMessage="개인정보처리방침을 불러올 수 없습니다."
      title="개인정보처리방침"
    />
  );
}
