import React from "react";
import type { UseFormReturn } from "react-hook-form";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import type { VisitorSettings } from "@/lib/types/visitor";
import { TextField } from "../form-fields/TextField";
import { PhoneField } from "../form-fields/PhoneField";
import { AddressField } from "../form-fields/AddressField";
import { User } from "lucide-react";

interface PersonalInfoSectionProps {
  form: UseFormReturn<VisitorFormData>;
  settings: VisitorSettings;
  formData: VisitorFormData;
}

export const PersonalInfoSection = ({
  form,
  settings,
  formData,
}: PersonalInfoSectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
      {/* 이름 */}
      <TextField form={form} name="visitor_name" icon={User} required={true} />

      {/* 연락처 */}
      {settings.requireVisitorContact && (
        <PhoneField form={form} required={settings.requireVisitorContact} />
      )}

      {/* 주소 */}
      <AddressField
        form={form}
        required={true}
        defaultDetailedAddress={formData.detailed_address}
      />
    </div>
  );
};
