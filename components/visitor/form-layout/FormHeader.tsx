import { useState } from "react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/common/logo";
import { LABELS, PAGE_HEADER } from "@/lib/constants/visitor";

interface FormHeaderProps {
  title?: string;
  description?: string;
  logoUrl?: string;
}

export const FormHeader = ({
  title = PAGE_HEADER.FORM_HEADER_DEFAULT_TITLE,
  description = PAGE_HEADER.FORM_HEADER_DEFAULT_DESCRIPTION,
  logoUrl = "/logo1.svg",
}: FormHeaderProps) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="text-center pb-2 sm:pb-3 border-b border-gray-100 px-3 sm:px-6 pt-3 sm:pt-6">
      <CardTitle className="text-base sm:text-2xl font-bold tracking-tight text-gray-900">
        {title}
      </CardTitle>
      <div className="flex flex-col items-center py-1.5 sm:py-2">
        {!logoError ? (
          <img
            src={logoUrl}
            alt={LABELS.FORM_HEADER_COMPANY_LOGO_ALT}
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
