"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { usePublicTermsQuery } from "@/lib/hooks/query/use-terms-query";
import ReactMarkdown from "react-markdown";
import { markdownComponents } from "@/lib/utils/markdown/markdown-components";
import { TermType } from "@/lib/types/common";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { AdminError } from "@/components/error/admin-error";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { LABELS, BUTTONS } from "@/lib/constants/terms";

interface TermsPageWrapperProps {
  termType: TermType;
  errorMessage: string;
  title?: string;
}

export function TermsPageWrapper({
  termType,
  errorMessage,
  title,
}: TermsPageWrapperProps) {
  const router = useRouter();

  // 약관 데이터 조회
  const {
    data: termsData,
    isLoading: termsLoading,
    error,
  } = usePublicTermsQuery(termType);

  // 뒤로가기 처리
  const handleGoBack = () => {
    router.back();
  };

  // 로딩 중이거나 데이터가 아직 없는 경우
  if (termsLoading) {
    return (
      <div className="flex-1 bg-background py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
            <div className="space-y-6">
              {/* 제목 스켈레톤 */}
              <Skeleton className="h-8 w-48" />

              {/* 본문 스켈레톤 */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 에러가 있거나 활성화된 약관이 없는 경우
  if (error || !termsData || termsData.length === 0) {
    return (
      <AdminError
        error={error || new Error(errorMessage)}
        reset={() => window.location.reload()}
        title={ERROR_CONFIGS.LOADING.title}
        description={errorMessage}
        isNotFound={!termsData || termsData.length === 0}
      />
    );
  }

  // 가장 최신 활성 약관의 content 가져오기
  const latestTerm = termsData[0];
  const content = latestTerm.content;

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="flex-1 bg-background py-10">
        <section className="prose prose-h1:font-bold prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-2 bg-white rounded-xl shadow-md p-8 max-w-4xl mx-auto border border-gray-100 break-all">
          {/* 뒤로가기 버튼 */}
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {BUTTONS.GO_BACK}
            </Button>
          </div>

          <div className="markdown-content">
            <ReactMarkdown components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        </section>
        <div className="mt-8 text-base text-muted-foreground text-center">
          {LABELS.TERMS_EFFECTIVE_DATE}
        </div>
      </div>
    </ErrorBoundary>
  );
}
