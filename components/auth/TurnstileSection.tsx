"use client";

import { memo } from "react";
import { Turnstile } from "@/components/common";
import { LABELS } from "@/lib/constants/auth";

interface TurnstileSectionProps {
  onVerify: (token: string) => void;
  onError: (error: string) => void;
  onExpire: () => void;
  error: string;
}

export const TurnstileSection = memo(
  ({ onVerify, onError, onExpire, error }: TurnstileSectionProps) => (
    <div className="space-y-2">
      <label className="text-sm text-gray-800">
        {LABELS.CAPTCHA_LABEL} <span className="text-red-500">*</span>
      </label>
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
        onVerify={onVerify}
        onError={onError}
        onExpire={onExpire}
        theme="light"
        size="normal"
        className="flex justify-center"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
);

TurnstileSection.displayName = "TurnstileSection";
