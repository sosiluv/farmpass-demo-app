import React from "react";
import type { UseFormReturn } from "react-hook-form";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import type { VisitorSettings } from "@/lib/types/visitor";
import { CarPlateField } from "../form-fields/CarPlateField";
import { VisitPurposeField } from "../form-fields/VisitPurposeField";
import { NotesField } from "../form-fields/NotesField";

interface VisitInfoSectionProps {
  form: UseFormReturn<VisitorFormData>;
  settings: VisitorSettings;
}

export const VisitInfoSection = ({ form, settings }: VisitInfoSectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
      {/* 차량번호 */}
      <CarPlateField form={form} required={false} />

      {/* 방문목적 */}
      {settings.requireVisitPurpose && (
        <VisitPurposeField
          form={form}
          required={settings.requireVisitPurpose}
        />
      )}

      {/* 비고 */}
      <NotesField form={form} required={false} />
    </div>
  );
};
