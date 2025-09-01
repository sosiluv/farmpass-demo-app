"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { TermManagement, TermType } from "@/lib/types/common";
import { LABELS } from "@/lib/constants/terms";

interface TermConsentItemProps {
  termType: TermType;
  termData?: TermManagement;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onViewTerm?: (termType: TermType) => void;
  isLoading?: boolean;
  isRequired?: boolean;
}

export function TermConsentItem({
  termType,
  termData,
  checked,
  onChange,
  onViewTerm,
  isLoading = false,
  isRequired = false,
}: TermConsentItemProps) {
  const getDefaultTitle = (type: TermType): string => {
    switch (type) {
      case "age_consent":
        return LABELS.DEFAULT_AGE_CONSENT_TITLE;
      case "privacy_consent":
        return LABELS.DEFAULT_PRIVACY_CONSENT_TITLE;
      case "terms":
        return LABELS.DEFAULT_TERMS_TITLE;
      case "marketing":
        return LABELS.DEFAULT_MARKETING_TITLE;
      default:
        return LABELS.DEFAULT_PRIVACY_TITLE;
    }
  };

  const title = termData?.title || getDefaultTitle(termType);

  const handleClick = () => {
    if (!isLoading) {
      onChange(!checked);
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewTerm) {
      onViewTerm(termType);
    }
  };

  return (
    <div
      className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer hover:bg-gray-50 shadow-sm hover:shadow-md"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Checkbox
            checked={checked}
            onCheckedChange={(checked) => onChange(checked as boolean)}
            disabled={isLoading}
            className="flex-shrink-0 h-5 w-5"
          />
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${
                isRequired
                  ? "text-red-500 bg-red-50"
                  : "text-gray-500 bg-gray-50"
              }`}
            >
              {isRequired ? LABELS.REQUIRED_TAG : LABELS.OPTIONAL_TAG}
            </span>
            <span className="text-sm font-medium text-gray-900">{title}</span>
          </div>
        </div>
        {onViewTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50 h-auto"
            onClick={handleViewClick}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
