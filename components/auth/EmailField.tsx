"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, Loader2 } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/auth";

interface EmailFieldProps {
  field: any;
  loading?: boolean;
  onBlur?: () => void;
  error?: string;
  isCheckingEmail?: boolean;
  autoComplete?: string;
  showFormMessage?: boolean;
}

export const EmailField = memo(
  ({
    field,
    loading = false,
    onBlur,
    error,
    isCheckingEmail = false,
    autoComplete = "username",
    showFormMessage = true,
  }: EmailFieldProps) => (
    <FormItem>
      <FormLabel className="text-sm text-gray-800">
        {LABELS.EMAIL} <span className="text-red-500">*</span>
      </FormLabel>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormControl>
          <Input
            {...field}
            type="email"
            placeholder={PLACEHOLDERS.EMAIL}
            onBlur={(e) => {
              field.onBlur();
              onBlur?.();
            }}
            autoComplete={autoComplete}
            className={`h-12 pl-10 input-focus ${
              error ? "border-red-500" : ""
            }`}
            disabled={loading || isCheckingEmail}
          />
        </FormControl>
        {isCheckingEmail && (
          <Loading
            spinnerSize={16}
            showText={false}
            minHeight="auto"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        )}
      </div>
      {showFormMessage && <FormMessage />}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </FormItem>
  )
);

EmailField.displayName = "EmailField";
