"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, LogIn, Key, Mail, CheckCircle } from "lucide-react";
import { BUTTONS } from "@/lib/constants/auth";

interface AuthButtonProps {
  type:
    | "login"
    | "register"
    | "reset-password"
    | "reset-password-confirm"
    | "email-confirm";
  loading: boolean;
  disabled?: boolean;
  redirecting?: boolean;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "outline";
}

export const AuthButton = memo(
  ({
    type,
    loading,
    disabled = false,
    redirecting = false,
    className = "h-12 w-full flex items-center justify-center",
    onClick,
    variant = "default",
  }: AuthButtonProps) => {
    const isDisabled = disabled || loading || redirecting;

    const getButtonContent = () => {
      if (loading || redirecting) {
        return (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {redirecting
              ? BUTTONS.REDIRECTING
              : type === "login"
              ? BUTTONS.LOGIN_LOADING
              : type === "register"
              ? BUTTONS.REGISTER_LOADING
              : type === "reset-password"
              ? BUTTONS.RESET_PASSWORD_LOADING
              : type === "reset-password-confirm"
              ? BUTTONS.RESET_PASSWORD_CONFIRM_LOADING
              : BUTTONS.EMAIL_CONFIRMATION_LOGIN}
          </>
        );
      }

      const getIcon = () => {
        switch (type) {
          case "login":
            return <LogIn className="h-4 w-4 mr-2" />;
          case "register":
            return <Plus className="h-4 w-4 mr-2" />;
          case "reset-password":
          case "reset-password-confirm":
            return <Key className="h-4 w-4 mr-2" />;
          case "email-confirm":
            return <CheckCircle className="h-4 w-4 mr-2" />;
          default:
            return null;
        }
      };

      const getText = () => {
        switch (type) {
          case "login":
            return BUTTONS.LOGIN_BUTTON;
          case "register":
            return BUTTONS.REGISTER_BUTTON;
          case "reset-password":
            return BUTTONS.RESET_PASSWORD_BUTTON;
          case "reset-password-confirm":
            return BUTTONS.RESET_PASSWORD_CONFIRM_BUTTON;
          case "email-confirm":
            return BUTTONS.EMAIL_CONFIRMATION_LOGIN;
          default:
            return "";
        }
      };

      return (
        <>
          {getIcon()}
          {getText()}
        </>
      );
    };

    return (
      <Button
        type={onClick ? "button" : "submit"}
        className={className}
        disabled={isDisabled}
        onClick={onClick}
        variant={variant}
      >
        {getButtonContent()}
      </Button>
    );
  }
);

AuthButton.displayName = "AuthButton";
