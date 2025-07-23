"use client";

import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import type { SecuritySectionProps } from "@/lib/types/account";
import { PasswordSection } from "./password-section";
import { LoginActivitySection } from "./login-activity-section";
import WithdrawSection from "./withdraw-section";

export function SecuritySection({
  profile,
  loading,
  onPasswordChange,
}: SecuritySectionProps) {
  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
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
        <WithdrawSection />
      </motion.div>
    </ErrorBoundary>
  );
}
