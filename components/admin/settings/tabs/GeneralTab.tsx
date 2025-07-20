"use client";

import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
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
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
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
