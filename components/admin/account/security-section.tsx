"use client";

import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import type { ChangePasswordFormData } from "@/lib/utils/validation/auth-validation";
import { PasswordSection } from "./password-section";
import { LoginActivitySection } from "./login-activity-section";
import WithdrawSection from "./withdraw-section";
import { Profile } from "@/lib/types/common";

interface SecuritySectionProps {
  profile: Profile;
  loading: boolean;
  onPasswordChange: (data: ChangePasswordFormData) => Promise<void>;
}

export function SecuritySection({
  profile,
  loading,
  onPasswordChange,
  socialUserInfo,
}: SecuritySectionProps & {
  socialUserInfo?: {
    isSocialUser: boolean;
    socialProvider: string;
    allProviders: string[];
    socialProviders: string[];
  };
}) {
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
          socialUserInfo={socialUserInfo}
        />
        <LoginActivitySection profile={profile} />
        <WithdrawSection />
      </motion.div>
    </ErrorBoundary>
  );
}
