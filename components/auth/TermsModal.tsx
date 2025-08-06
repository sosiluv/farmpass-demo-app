"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, FileText, Mail, X, Loader2 } from "lucide-react";
import { usePublicTermsQuery } from "@/lib/hooks/query/use-terms-query";
import { TermType } from "@/lib/types/terms";
import ReactMarkdown from "react-markdown";
import { markdownComponents } from "@/lib/utils/markdown/markdown-components";
import { LABELS, TERM_TYPE_CONFIG } from "@/lib/constants/terms";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  termType: TermType;
}

// 아이콘 문자열을 실제 컴포넌트로 매핑
const iconMap = {
  Shield,
  FileText,
  Mail,
};

export function TermsModal({ isOpen, onClose, termType }: TermsModalProps) {
  const [content, setContent] = useState<string>("");

  // 약관 데이터 조회
  const { data: termsData, isLoading: termsLoading } =
    usePublicTermsQuery(termType);

  useEffect(() => {
    if (isOpen && termsData && termsData.length > 0) {
      // 가장 최신 활성 약관 찾기
      const latestTerm = termsData[0]; // API에서 이미 정렬되어 옴
      setContent(latestTerm.content);
    }
  }, [isOpen, termsData]);

  const Icon = iconMap[TERM_TYPE_CONFIG[termType].icon as keyof typeof iconMap];
  const title = TERM_TYPE_CONFIG[termType].title;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-0 px-6 pt-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl font-semibold break-words">
                {title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {LABELS.MODAL_DESCRIPTION}
              </DialogDescription>
              {termsData && termsData.length > 0 && (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    v{termsData[0].version}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {termsData[0].updated_at &&
                      new Date(termsData[0].updated_at).toLocaleDateString(
                        "ko-KR"
                      )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <Separator className="mx-6 sm:mx-0" />

        <div className="flex-1 overflow-y-auto px-6">
          {termsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : content ? (
            <div className="prose max-w-none">
              <div className="markdown-content text-sm sm:text-base leading-relaxed">
                <ReactMarkdown components={markdownComponents}>
                  {content.replace(/^#\s+.*?\n/, "")}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              {LABELS.TERMS_NOT_AVAILABLE}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
