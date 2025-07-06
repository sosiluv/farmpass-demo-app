"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Save } from "lucide-react";
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
import { AddressSearch } from "@/components/common/address-search";
import { ErrorBoundary } from "@/components/error/error-boundary";
import type { CompanySectionProps, CompanyFormData } from "@/lib/types/account";
import AccountCardHeader from "./AccountCardHeader";

// 상수 정의
const EMPLOYEE_COUNT_OPTIONS = [
  { value: "10", label: "1-10명" },
  { value: "50", label: "10-50명" },
  { value: "100", label: "50-100명" },
  { value: "500", label: "100명 이상" },
] as const;

const BUSINESS_TYPE_OPTIONS = [
  { value: "축산업", label: "축산업" },
  { value: "농업", label: "농업" },
  { value: "원예업", label: "원예업" },
  { value: "수산업", label: "수산업" },
  { value: "기타", label: "기타" },
] as const;

export function CompanySection({
  profile,
  loading,
  onSave,
}: CompanySectionProps) {
  const [companyData, setCompanyData] = useState<CompanyFormData>({
    companyName: "",
    companyAddress: "",
    businessType: "",
    company_description: "",
    establishment_date: "",
    employee_count: "",
    company_website: "",
  });

  useEffect(() => {
    if (profile) {
      setCompanyData({
        companyName: profile.company_name || "",
        companyAddress: profile.company_address || "",
        businessType: profile.business_type || "",
        company_description: profile.company_description || "",
        establishment_date: profile.establishment_date || "",
        employee_count: profile.employee_count
          ? profile.employee_count.toString()
          : "",
        company_website: profile.company_website || "",
      });
    }
  }, [profile]);

  return (
    <ErrorBoundary
      title="회사 정보 섹션 오류"
      description="회사 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <AccountCardHeader
            icon={Building2}
            title="회사 정보"
            description="회사 및 농장 정보를 관리합니다"
          />
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">회사명</Label>
                <Input
                  id="companyName"
                  value={companyData.companyName}
                  onChange={(e) =>
                    setCompanyData((prev) => ({
                      ...prev,
                      companyName: e.target.value,
                    }))
                  }
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">업종</Label>
                <Select
                  value={companyData.businessType}
                  onValueChange={(value) =>
                    setCompanyData((prev) => ({
                      ...prev,
                      businessType: value,
                    }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="업종 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">회사 주소</Label>
              <AddressSearch
                onSelect={(address, detailedAddress) =>
                  setCompanyData((prev) => ({
                    ...prev,
                    companyAddress:
                      address + (detailedAddress ? ` ${detailedAddress}` : ""),
                  }))
                }
                defaultDetailedAddress=""
              />
              <Input
                id="companyAddress"
                value={companyData.companyAddress}
                placeholder="주소 검색을 통해 주소를 입력해주세요"
                readOnly
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="establishment_date">설립일</Label>
                <Input
                  id="establishment_date"
                  type="date"
                  value={companyData.establishment_date}
                  onChange={(e) =>
                    setCompanyData((prev) => ({
                      ...prev,
                      establishment_date: e.target.value,
                    }))
                  }
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_count">직원 수</Label>
                <Select
                  value={companyData.employee_count}
                  onValueChange={(value) =>
                    setCompanyData((prev) => ({
                      ...prev,
                      employee_count: value,
                    }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="직원 수 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_COUNT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_website">웹사이트</Label>
              <Input
                id="company_website"
                type="url"
                value={companyData.company_website}
                onChange={(e) =>
                  setCompanyData((prev) => ({
                    ...prev,
                    company_website: e.target.value,
                  }))
                }
                placeholder="https://example.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_description">회사 소개</Label>
              <Textarea
                id="company_description"
                value={companyData.company_description}
                onChange={(e) =>
                  setCompanyData((prev) => ({
                    ...prev,
                    company_description: e.target.value,
                  }))
                }
                placeholder="회사 및 농장에 대한 간단한 소개를 입력하세요"
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => onSave(companyData)}
                disabled={loading}
                className="btn-hover"
              >
                <Save className="mr-2 h-4 w-4" />
                저장
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </ErrorBoundary>
  );
}
