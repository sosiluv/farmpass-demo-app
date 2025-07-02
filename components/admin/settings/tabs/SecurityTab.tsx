"use client";

import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/error/error-boundary";
import type { SystemSettings } from "@/lib/types/settings";
import PasswordPolicyCard from "../security/PasswordPolicyCard";
import LoginSecurityCard from "../security/LoginSecurityCard";

interface SecurityTabProps {
  settings: Pick<
    SystemSettings,
    | "passwordMinLength"
    | "passwordRequireSpecialChar"
    | "passwordRequireNumber"
    | "passwordRequireUpperCase"
    | "passwordRequireLowerCase"
    | "maxLoginAttempts"
    | "accountLockoutDurationMinutes"
  >;
  onUpdate: (
    key: keyof Pick<
      SystemSettings,
      | "passwordMinLength"
      | "passwordRequireSpecialChar"
      | "passwordRequireNumber"
      | "passwordRequireUpperCase"
      | "passwordRequireLowerCase"
      | "maxLoginAttempts"
      | "accountLockoutDurationMinutes"
    >,
    value: any
  ) => void;
  isLoading?: boolean;
}

export default function SecurityTab({
  settings,
  onUpdate,
  isLoading = false,
}: SecurityTabProps) {
  return (
    <ErrorBoundary
      title="보안 설정 탭 오류"
      description="보안 설정을 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <PasswordPolicyCard
          settings={settings}
          onUpdate={onUpdate}
          isLoading={isLoading}
        />
        <LoginSecurityCard
          settings={settings}
          onUpdate={onUpdate}
          isLoading={isLoading}
        />
      </motion.div>
    </ErrorBoundary>
  );
}
