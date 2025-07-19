import React from "react";
import type { UseFormReturn } from "react-hook-form";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import { DisinfectionField } from "../form-fields/DisinfectionField";
import { ConsentField } from "../form-fields/ConsentField";

interface ConsentSectionProps {
  form: UseFormReturn<VisitorFormData>;
}

export const ConsentSection = ({ form }: ConsentSectionProps) => {
  return (
    <div className="space-y-3 sm:space-y-6">
      {/* 소독여부 */}
      <DisinfectionField form={form} />

      {/* 개인정보 동의 */}
      <ConsentField form={form} />
    </div>
  );
};
