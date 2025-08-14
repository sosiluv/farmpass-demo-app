"use client";

import { memo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import {
  CommonSheetHeader,
  CommonSheetContent,
} from "@/components/ui/sheet-common";
import { ExternalLink, Loader2 } from "lucide-react";
import { usePublicTermsQuery } from "@/lib/hooks/query/use-terms-query";
import { TermManagement, TermType } from "@/lib/types/common";
import { TermsSheet } from "./TermsSheet";
import { PAGE_HEADER, LABELS, BUTTONS } from "@/lib/constants/terms";

interface TermsConsentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent?: (
    privacyConsent: boolean,
    termsConsent: boolean,
    marketingConsent: boolean
  ) => void;
  onComplete?: () => void;
  loading?: boolean;
  mode?: "register" | "reconsent";
}

export const TermsConsentSheet = memo(
  ({
    open,
    onOpenChange,
    onConsent,
    loading = false,
    mode = "register",
  }: TermsConsentSheetProps) => {
    const [privacyConsent, setPrivacyConsent] = useState(false);
    const [termsConsent, setTermsConsent] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTermType, setSelectedTermType] =
      useState<TermType>("privacy_consent");

    // 약관 데이터 조회
    const { data: termsData, isLoading: termsLoading } = usePublicTermsQuery();

    // 로딩 상태 (외부에서 전달받은 값만 사용)
    const isLoading = loading;

    // 전체 동의 상태 계산
    const allConsent = privacyConsent && termsConsent && marketingConsent;

    // 전체 동의 처리
    const handleAllConsent = (checked: boolean) => {
      setPrivacyConsent(checked);
      setTermsConsent(checked);
      setMarketingConsent(checked);
    };

    // 약관 모달 열기
    const handleOpenTermModal = (termType: TermType) => {
      setSelectedTermType(termType);
      setModalOpen(true);
    };

    const handleConsent = async () => {
      if (!privacyConsent || !termsConsent) {
        return; // 필수 약관 동의가 없으면 처리하지 않음
      }

      // mode와 관계없이 항상 onConsent 콜백 호출
      if (onConsent) {
        onConsent(privacyConsent, termsConsent, marketingConsent);
      }
    };

    const isConsentValid = privacyConsent && termsConsent;

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
            showHandle={true}
            enableDragToClose={true}
            dragDirection="vertical"
            dragThreshold={50}
            onClose={() => onOpenChange(false)}
          >
            <CommonSheetHeader title={title} description={description} />

            <div className="flex-1 overflow-y-auto py-2 sm:py-3 px-4">
              {termsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">
                    {LABELS.LOADING_TERMS}
                  </span>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {/* 전체 동의하기 */}
                  <div
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={() => !isLoading && handleAllConsent(!allConsent)}
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

                  {/* 개인정보 수집 및 이용 동의 (필수) */}
                  {termsData?.find(
                    (term: TermManagement) => term.type === "privacy_consent"
                  ) && (
                    <div
                      className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer hover:bg-gray-50 shadow-sm hover:shadow-md"
                      onClick={() =>
                        !isLoading && setPrivacyConsent(!privacyConsent)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={privacyConsent}
                            onCheckedChange={(checked) =>
                              setPrivacyConsent(checked as boolean)
                            }
                            disabled={isLoading}
                            className="flex-shrink-0 h-5 w-5"
                          />
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                              {LABELS.REQUIRED_TAG}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {termsData.find(
                                (term: TermManagement) =>
                                  term.type === "privacy_consent"
                              )?.title || LABELS.DEFAULT_PRIVACY_CONSENT_TITLE}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTermModal("privacy_consent");
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 서비스 이용약관 동의 (필수) */}
                  {termsData?.find(
                    (term: TermManagement) => term.type === "terms"
                  ) && (
                    <div
                      className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer hover:bg-gray-50 shadow-sm hover:shadow-md"
                      onClick={() =>
                        !isLoading && setTermsConsent(!termsConsent)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={termsConsent}
                            onCheckedChange={(checked) =>
                              setTermsConsent(checked as boolean)
                            }
                            disabled={isLoading}
                            className="flex-shrink-0 h-5 w-5"
                          />
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                              {LABELS.REQUIRED_TAG}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {termsData.find(
                                (term: TermManagement) => term.type === "terms"
                              )?.title || LABELS.DEFAULT_TERMS_TITLE}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTermModal("terms");
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 마케팅 및 이벤트 정보 수신 동의 (선택) */}
                  {termsData?.find(
                    (term: TermManagement) => term.type === "marketing"
                  ) && (
                    <div
                      className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer hover:bg-gray-50 shadow-sm hover:shadow-md"
                      onClick={() =>
                        !isLoading && setMarketingConsent(!marketingConsent)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={marketingConsent}
                            onCheckedChange={(checked) =>
                              setMarketingConsent(checked as boolean)
                            }
                            disabled={isLoading}
                            className="flex-shrink-0 h-5 w-5"
                          />
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                              {LABELS.OPTIONAL_TAG}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {termsData.find(
                                (term: TermManagement) =>
                                  term.type === "marketing"
                              )?.title || LABELS.DEFAULT_MARKETING_TITLE}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTermModal("marketing");
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 하단 고정 버튼 영역 */}
            <div className="border-t border-gray-100 pt-4 sm:pt-6 space-y-3 px-4 pb-4 sm:pb-6">
              <Button
                onClick={handleConsent}
                disabled={!isConsentValid || isLoading}
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
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
            if (selectedTermType === "privacy_consent") {
              setPrivacyConsent(true);
            } else if (selectedTermType === "terms") {
              setTermsConsent(true);
            } else if (selectedTermType === "marketing") {
              setMarketingConsent(true);
            }
            setModalOpen(false);
          }}
        />
      </>
    );
  }
);

TermsConsentSheet.displayName = "TermsConsentSheet";
