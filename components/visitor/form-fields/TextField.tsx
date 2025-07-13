import React from "react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import { LABELS, PLACEHOLDERS } from "@/constants/visitor-form";

interface TextFieldProps {
  form: UseFormReturn<VisitorFormData>;
  name: keyof VisitorFormData;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  className?: string;
}

export const TextField = ({
  form,
  name,
  icon: Icon,
  required = false,
  fullWidth = false,
  placeholder,
  className = "",
}: TextFieldProps) => {
  const labelKey = getLabelKey(name);
  const placeholderKey = getPlaceholderKey(name);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={`space-y-2 sm:space-y-2 ${
            fullWidth ? "md:col-span-2" : ""
          } ${className}`}
        >
          <FormLabel className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {LABELS[labelKey]}
            {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder={
                placeholder ||
                (placeholderKey ? PLACEHOLDERS[placeholderKey] : "")
              }
              className="h-10 sm:h-12 bg-gray-50 border border-gray-200 text-sm"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// 필드명을 라벨 키로 매핑
const getLabelKey = (fieldName: keyof VisitorFormData): keyof typeof LABELS => {
  const mapping: Record<keyof VisitorFormData, keyof typeof LABELS> = {
    fullName: "FULL_NAME",
    phoneNumber: "PHONE_NUMBER",
    address: "ADDRESS",
    detailedAddress: "ADDRESS",
    carPlateNumber: "CAR_PLATE",
    visitPurpose: "VISIT_PURPOSE",
    disinfectionCheck: "DISINFECTION",
    notes: "NOTES",
    profilePhoto: "PROFILE_PHOTO",
    consentGiven: "CONSENT",
  };
  return mapping[fieldName];
};

// 필드명을 플레이스홀더 키로 매핑
const getPlaceholderKey = (
  fieldName: keyof VisitorFormData
): keyof typeof PLACEHOLDERS | null => {
  const mapping: Record<
    keyof VisitorFormData,
    keyof typeof PLACEHOLDERS | null
  > = {
    fullName: "FULL_NAME",
    phoneNumber: "PHONE_NUMBER",
    address: null,
    detailedAddress: null,
    carPlateNumber: "CAR_PLATE",
    visitPurpose: "VISIT_PURPOSE",
    disinfectionCheck: null,
    notes: "NOTES",
    profilePhoto: null,
    consentGiven: null,
  };
  return mapping[fieldName];
};
