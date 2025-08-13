"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressSearch } from "@/components/ui/address-search";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { useAccountForm } from "@/hooks/account/useAccountForm";
import type { CompanyFormData } from "@/lib/utils/validation/company-validation";
import { companyFormSchema } from "@/lib/utils/validation/company-validation";
import type { Profile } from "@/lib/types/common";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import AccountCardHeader from "./AccountCardHeader";
import {
  EMPLOYEE_COUNT_OPTIONS,
  BUSINESS_TYPE_OPTIONS,
  LABELS,
  PLACEHOLDERS,
  BUTTONS,
  PAGE_HEADER,
} from "@/lib/constants/account";

interface CompanySectionProps {
  profile: Profile;
  loading: boolean;
  onSave: (data: CompanyFormData) => Promise<void>;
}

export function CompanySection({
  profile,
  loading,
  onSave,
}: CompanySectionProps) {
  const { showError } = useCommonToast();
  // 폼 데이터 관리 - 안정화된 initialData
  const initialData = useMemo<CompanyFormData>(
    () => ({
      companyName: profile?.company_name || "",
      companyAddress: profile?.company_address || "",
      businessType: profile?.business_type || "",
      company_description: profile?.company_description || "",
      establishment_date: profile?.establishment_date || "",
      employee_count: profile?.employee_count
        ? profile.employee_count.toString()
        : "",
      company_website: profile?.company_website || "",
    }),
    [
      profile?.company_name,
      profile?.company_address,
      profile?.business_type,
      profile?.company_description,
      profile?.establishment_date,
      profile?.employee_count,
      profile?.company_website,
    ]
  );

  const { formData, hasChanges, handleChange, resetChanges } = useAccountForm({
    initialData,
  });

  const handleSave = async () => {
    if (!hasChanges || loading) return;

    const result = companyFormSchema.safeParse(formData);
    if (!result.success) {
      const firstError =
        result.error.errors[0]?.message || "입력값을 확인하세요.";
      showError("회사 정보 저장 실패", firstError);
      return;
    }

    try {
      await onSave(formData);
      resetChanges();
    } catch (error) {
      console.error("[COMPANY_SECTION] Failed to save company data:", error);
    }
  };

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <AccountCardHeader
            icon={Building2}
            title={PAGE_HEADER.COMPANY_INFO_TITLE}
            description={PAGE_HEADER.COMPANY_INFO_DESCRIPTION}
          />
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="companyName"
                  className="text-sm sm:text-base font-medium"
                >
                  {LABELS.COMPANY_NAME}
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName || ""}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  disabled={loading}
                  placeholder={PLACEHOLDERS.COMPANY_NAME}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="businessType"
                  className="text-sm sm:text-base font-medium"
                >
                  {LABELS.BUSINESS_TYPE}
                </Label>
                <Select
                  value={formData.businessType || ""}
                  onValueChange={(value) => handleChange("businessType", value)}
                  disabled={loading}
                >
                  <SelectTrigger
                    id="businessType"
                    className="text-sm sm:text-base"
                  >
                    <SelectValue
                      placeholder={PLACEHOLDERS.BUSINESS_TYPE_SELECT}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(BUSINESS_TYPE_OPTIONS || []).map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-sm sm:text-base"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="companyAddress"
                className="text-sm sm:text-base font-medium"
              >
                {LABELS.COMPANY_ADDRESS}
              </Label>
              <AddressSearch
                onSelect={(address, detailedAddress) =>
                  handleChange(
                    "companyAddress",
                    address + (detailedAddress ? ` ${detailedAddress}` : "")
                  )
                }
                defaultDetailedAddress=""
              />
              <Input
                id="companyAddress"
                value={formData.companyAddress || ""}
                placeholder={PLACEHOLDERS.COMPANY_ADDRESS}
                readOnly
                disabled={loading}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="establishment_date"
                  className="text-sm sm:text-base font-medium"
                >
                  {LABELS.ESTABLISHMENT_DATE}
                </Label>
                <Input
                  id="establishment_date"
                  type="date"
                  value={formData.establishment_date || ""}
                  onChange={(e) =>
                    handleChange("establishment_date", e.target.value)
                  }
                  onFocus={(e) => {
                    if (e.target.showPicker) e.target.showPicker();
                  }}
                  disabled={loading}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="employee_count"
                  className="text-sm sm:text-base font-medium"
                >
                  {LABELS.EMPLOYEE_COUNT}
                </Label>
                <Select
                  value={formData.employee_count || ""}
                  onValueChange={(value) =>
                    handleChange("employee_count", value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger
                    id="employee_count"
                    className="text-sm sm:text-base"
                  >
                    <SelectValue
                      placeholder={PLACEHOLDERS.EMPLOYEE_COUNT_SELECT}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(EMPLOYEE_COUNT_OPTIONS || []).map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-sm sm:text-base"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="company_website"
                className="text-sm sm:text-base font-medium"
              >
                {LABELS.COMPANY_WEBSITE}
              </Label>
              <Input
                id="company_website"
                type="url"
                value={formData.company_website || ""}
                onChange={(e) =>
                  handleChange("company_website", e.target.value)
                }
                placeholder={PLACEHOLDERS.COMPANY_WEBSITE}
                disabled={loading}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="company_description"
                className="text-sm sm:text-base font-medium"
              >
                {LABELS.COMPANY_DESCRIPTION}
              </Label>
              <Textarea
                id="company_description"
                value={formData.company_description || ""}
                onChange={(e) =>
                  handleChange("company_description", e.target.value)
                }
                placeholder={PLACEHOLDERS.COMPANY_DESCRIPTION}
                rows={4}
                disabled={loading}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={loading || !hasChanges}
                className="btn-hover text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {BUTTONS.SAVING}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {BUTTONS.SAVE_COMPANY_INFO}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </ErrorBoundary>
  );
}
