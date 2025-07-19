import React from "react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/common";

interface FormHeaderProps {
  title?: string;
  description?: string;
  logoUrl?: string;
}

export const FormHeader = ({
  title = "방문자 등록",
  description = "방문 정보를 정확히 입력해주세요. 모든 정보는 방역 관리 목적으로만 사용됩니다.",
  logoUrl = "/default-logo1.png",
}: FormHeaderProps) => {
  const [logoError, setLogoError] = React.useState(false);

  return (
    <div className="text-center pb-2 sm:pb-3 border-b border-gray-100 px-3 sm:px-6 pt-3 sm:pt-6">
      <CardTitle className="text-base sm:text-2xl font-bold tracking-tight text-gray-900">
        {title}
      </CardTitle>
      <div className="flex flex-col items-center py-1.5 sm:py-2">
        {!logoError ? (
          <img
            src={logoUrl}
            alt="회사 로고"
            className="w-[60%] sm:w-80 h-auto max-w-[140px] sm:max-w-md mb-1.5 sm:mb-4 drop-shadow"
            style={{ objectFit: "contain" }}
            onError={() => setLogoError(true)}
          />
        ) : (
          <Logo size="xl" className="mb-3 sm:mb-4 text-blue-500" />
        )}
      </div>
      <CardDescription className="text-center text-xs sm:text-base text-gray-600 px-2">
        {description}
      </CardDescription>
    </div>
  );
};
