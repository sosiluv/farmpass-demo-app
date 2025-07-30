import { Loader2 } from "lucide-react";
import type { CSSProperties } from "react";
import { Button } from "../ui/button";

interface SocialLoginButtonProps {
  provider: "kakao" | "google";
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  iconSrc: string;
  style?: CSSProperties;
}

export function SocialLoginButton({
  provider,
  loading,
  onClick,
  disabled,
  label,
  iconSrc,
  style,
}: SocialLoginButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className="w-full h-12 min-h-[48px] rounded-md shadow-sm relative flex items-center justify-center"
      style={style}
      disabled={disabled}
    >
      {loading ? (
        <div className="flex items-center justify-center w-full h-full">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {label}
        </div>
      ) : (
        <>
          <img
            src={iconSrc}
            alt={label}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6"
          />
          <span className="w-full text-center block">{label}</span>
        </>
      )}
    </Button>
  );
}
