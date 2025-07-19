"use client";

import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/error/error-boundary";
import type { SecuritySectionProps } from "@/lib/types/account";
import { PasswordSection } from "./password-section";
import { LoginActivitySection } from "./login-activity-section";

export function SecuritySection({
  profile,
  loading,
  onPasswordChange,
}: SecuritySectionProps) {
  return (
    <ErrorBoundary
      title="보안 섹션 오류"
      description="보안 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <PasswordSection
          profile={profile}
          loading={loading}
          onPasswordChange={onPasswordChange}
        />
        <LoginActivitySection profile={profile} />
      </motion.div>
    </ErrorBoundary>
  );
}
