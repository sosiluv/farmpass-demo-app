"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Lock } from "lucide-react";
import { PasswordStrength } from "@/components/ui/password-strength";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/auth";

interface PasswordFieldProps {
  field: any;
  type?: "current" | "new" | "confirm";
  loading?: boolean;
  autoComplete?: string;
  showPasswordStrength?: boolean;
  showFormMessage?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const PasswordField = memo(
  ({
    field,
    type = "new",
    loading = false,
    autoComplete,
    showPasswordStrength,
    showFormMessage = true,
    label,
    placeholder,
    className = "h-12 pl-10 input-focus",
  }: PasswordFieldProps) => {
    // 타입별 기본값 설정
    const getDefaultValues = () => {
      switch (type) {
        case "current":
          return {
            label: label || LABELS.CURRENT_PASSWORD,
            placeholder: placeholder || PLACEHOLDERS.CURRENT_PASSWORD,
            autoComplete: autoComplete || "current-password",
            showStrength: false,
            className,
          };
        case "new":
          return {
            label: label || LABELS.PASSWORD,
            placeholder: placeholder || PLACEHOLDERS.PASSWORD,
            autoComplete: autoComplete || "new-password",
            showStrength: showPasswordStrength !== false,
            className,
          };
        case "confirm":
          return {
            label: label || LABELS.CONFIRM_PASSWORD,
            placeholder: placeholder || PLACEHOLDERS.CONFIRM_PASSWORD,
            autoComplete: autoComplete || "new-password",
            showStrength: false,
            className,
          };
        default:
          return {
            label: label || LABELS.PASSWORD,
            placeholder: placeholder || PLACEHOLDERS.PASSWORD,
            autoComplete: autoComplete || "new-password",
            showStrength: showPasswordStrength !== false,
            className,
          };
      }
    };

    const {
      label: finalLabel,
      placeholder: finalPlaceholder,
      autoComplete: finalAutoComplete,
      showStrength,
      className: finalClassName,
    } = getDefaultValues();

    return (
      <FormItem>
        <FormLabel className="text-sm text-foreground">
          {finalLabel} <span className="text-red-500">*</span>
        </FormLabel>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <FormControl>
            <Input
              {...field}
              type="password"
              placeholder={finalPlaceholder}
              autoComplete={finalAutoComplete}
              className={finalClassName}
              disabled={loading}
            />
          </FormControl>
        </div>
        {showFormMessage && <FormMessage />}
        {showStrength && <PasswordStrength password={field.value} />}
      </FormItem>
    );
  }
);

PasswordField.displayName = "PasswordField";
