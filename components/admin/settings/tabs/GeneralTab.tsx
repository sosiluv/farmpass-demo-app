"use client";

import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/error/error-boundary";
import type { SystemSettings } from "@/lib/types/settings";
import {
  BrandingSection,
  LocalizationSection,
  DisplayFormatSection,
} from "../general";

interface GeneralTabProps {
  settings: SystemSettings;
  onSettingChange: (key: keyof SystemSettings, value: any) => void;
  loading?: boolean;
}

export default function GeneralTab({
  settings,
  onSettingChange,
  loading,
}: GeneralTabProps) {
  return (
    <ErrorBoundary
      title="일반 설정 탭 오류"
      description="일반 설정을 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <BrandingSection
          settings={settings}
          onSettingChange={onSettingChange}
          loading={loading}
        />

        <LocalizationSection
          settings={settings}
          onSettingChange={onSettingChange}
          loading={loading}
        />

        <DisplayFormatSection
          settings={settings}
          onSettingChange={onSettingChange}
          loading={loading}
        />
      </motion.div>
    </ErrorBoundary>
  );
}
