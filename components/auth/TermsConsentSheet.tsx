"use client";

import { memo, useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import {
  CommonSheetHeader,
  CommonSheetContent,
} from "@/components/ui/sheet-common";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { usePublicTermsQuery } from "@/lib/hooks/query/use-terms-query";
import { TermManagement, TermType } from "@/lib/types/common";
import { TermsSheet } from "./TermsSheet";
import { TermConsentItem } from "./TermConsentItem";
import {
  PAGE_HEADER,
  LABELS,
  BUTTONS,
  TERM_CONFIGS,
} from "@/lib/constants/terms";

interface TermsConsentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent?: (
    privacyConsent: boolean,
    termsConsent: boolean,
    marketingConsent: boolean,
    ageConsent: boolean
  ) => void;
  onComplete?: () => void;
  loading?: boolean;
  mode?: "register" | "reconsent";
}

// 약관 타입별 설정
interface TermConfig {
  type: TermType;
  isRequired: boolean;
  hasViewOption: boolean;
  order: number;
}

export const TermsConsentSheet = memo(
  ({
    open,
    onOpenChange,
    onConsent,
    loading = false,
    mode = "register",
  }: TermsConsentSheetProps) => {
    // 통합된 상태 관리
    const [consents, setConsents] = useState<Record<TermType, boolean>>({
      privacy_consent: false,
      terms: false,
      marketing: false,
      age_consent: false,
      privacy: false,
    });

    // 타입 안전한 TERM_CONFIGS
    const termConfigs = TERM_CONFIGS as readonly TermConfig[];
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTermType, setSelectedTermType] =
      useState<TermType>("privacy_consent");

    // 약관 데이터 조회
    const { data: termsData, isLoading: termsLoading } = usePublicTermsQuery();

    // 로딩 상태 (외부에서 전달받은 값만 사용)
    const isLoading = loading;

    // 약관 데이터 매핑
    const termsDataMap = useMemo(() => {
      return (termsData || []).reduce((acc, term) => {
        acc[term.type as TermType] = term;
        return acc;
      }, {} as Record<TermType, TermManagement>);
    }, [termsData]);

    // 전체 동의 상태 계산
    const allConsent = termConfigs.every((config) => consents[config.type]);

    // 필수 동의 상태 계산
    const isConsentValid = termConfigs
      .filter((config) => config.isRequired)
      .every((config) => consents[config.type]);

    // 개별 동의 처리
    const handleConsentChange = (termType: TermType, checked: boolean) => {
      setConsents((prev) => ({
        ...prev,
        [termType]: checked,
      }));
    };

    // 전체 동의 처리
    const handleAllConsent = (checked: boolean) => {
      const newConsents = { ...consents };
      termConfigs.forEach((config) => {
        newConsents[config.type] = checked;
      });
      setConsents(newConsents);
    };

    // 약관 모달 열기
    const handleOpenTermModal = (termType: TermType) => {
      setSelectedTermType(termType);
      setModalOpen(true);
    };

    const handleConsent = async () => {
      if (!isConsentValid) {
        return; // 필수 약관 동의가 없으면 처리하지 않음
      }

      // mode와 관계없이 항상 onConsent 콜백 호출
      if (onConsent) {
        onConsent(
          consents.privacy_consent,
          consents.terms,
          consents.marketing,
          consents.age_consent
        );
      }
    };

    // 제목과 설명을 모드에 따라 변경
    const title =
      mode === "reconsent"
        ? PAGE_HEADER.CONSENT_SHEET_TITLE_RECONSENT
        : PAGE_HEADER.CONSENT_SHEET_TITLE_REGISTER;
    const description =
      mode === "reconsent"
        ? PAGE_HEADER.CONSENT_SHEET_DESC_RECONSENT
        : PAGE_HEADER.CONSENT_SHEET_DESC_REGISTER;
    const buttonText =
      mode === "reconsent"
        ? BUTTONS.CONSENT_RECONSENT
        : BUTTONS.CONSENT_REGISTER;
    const loadingText =
      mode === "reconsent"
        ? BUTTONS.PROCESSING_RECONSENT
        : BUTTONS.PROCESSING_REGISTER;

    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <CommonSheetContent
            side="bottom"
            enableDragToResize={true}
            onClose={() => onOpenChange(false)}
            open={open}
          >
            <CommonSheetHeader title={title} description={description} />

            <ScrollArea className="flex-1">
              <div className="px-4">
                {termsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">
                      {LABELS.LOADING_TERMS}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 전체 동의하기 */}
                    <div
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm hover:shadow-md"
                      onClick={() =>
                        !isLoading && handleAllConsent(!allConsent)
                      }
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={allConsent}
                          onCheckedChange={(checked) =>
                            handleAllConsent(checked as boolean)
                          }
                          disabled={isLoading}
                          className="flex-shrink-0 h-5 w-5"
                        />
                        <div className="flex-1">
                          <span className="text-base font-bold text-gray-900">
                            {LABELS.ALL_CONSENT}
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            {LABELS.ALL_CONSENT_DESC}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 약관별 동의 항목들 */}
                    {termConfigs.map((config) => {
                      const termData = termsDataMap[config.type];
                      // 약관 데이터가 있는 경우에만 렌더링
                      if (!termData && config.type !== "age_consent")
                        return null;

                      return (
                        <TermConsentItem
                          key={config.type}
                          termType={config.type}
                          termData={termData}
                          checked={consents[config.type]}
                          onChange={(checked) =>
                            handleConsentChange(config.type, checked)
                          }
                          onViewTerm={
                            config.hasViewOption
                              ? handleOpenTermModal
                              : undefined
                          }
                          isLoading={isLoading}
                          isRequired={config.isRequired}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* 하단 고정 버튼 영역 */}
            <div className="border-t border-gray-100 pt-4 sm:pt-6 space-y-3 px-4 pb-4 sm:pb-6">
              <Button
                onClick={handleConsent}
                disabled={!isConsentValid || isLoading}
                className="w-full h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {loadingText}
                  </>
                ) : (
                  <>
                    <span>{buttonText}</span>
                  </>
                )}
              </Button>

              {!isConsentValid && (
                <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span>{LABELS.CONSENT_REQUIRED_MESSAGE}</span>
                </div>
              )}
            </div>
          </CommonSheetContent>
        </Sheet>

        {/* 약관 모달 */}
        <TermsSheet
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          termType={selectedTermType}
          onConsent={() => {
            // 약관 모달에서 동의하기 버튼 클릭 시 해당 체크박스 자동 체크
            handleConsentChange(selectedTermType, true);
            setModalOpen(false);
          }}
        />
      </>
    );
  }
);

TermsConsentSheet.displayName = "TermsConsentSheet";
