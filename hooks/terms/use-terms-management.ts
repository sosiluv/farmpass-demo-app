import { useState, useEffect } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import {
  useTermsQuery,
  useUpdateTermMutation,
  useActivateTermMutation,
  useCreateTermMutation,
  useDeleteTermMutation,
} from "@/lib/hooks/query/use-terms-query";
import { TermType } from "@/lib/types/terms";
import { TermManagement } from "@/lib/types/common";

export function useTermsManagement() {
  const { showSuccess, showError } = useCommonToast();

  // 상태 관리
  const [activeTab, setActiveTab] = useState<TermType>("privacy");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [localContent, setLocalContent] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<string>("");

  // 데이터 조회
  const { data: termsData, isLoading: termsLoading, refetch } = useTermsQuery();

  // 현재 선택된 탭의 약관 데이터
  const currentTerm =
    termsData?.find(
      (term: TermManagement) =>
        term.type === activeTab && term.version === selectedVersion
    ) || termsData?.find((term: TermManagement) => term.type === activeTab);

  // 현재 탭의 모든 버전 약관들
  const currentTabTerms =
    termsData?.filter((term: TermManagement) => term.type === activeTab) || [];

  // 뮤테이션 훅들
  const updateTermMutation = useUpdateTermMutation();
  const activateTermMutation = useActivateTermMutation();
  const createTermMutation = useCreateTermMutation();
  const deleteTermMutation = useDeleteTermMutation();

  // 탭이 변경되거나 약관 데이터가 로드되면 로컬 내용 업데이트
  useEffect(() => {
    if (currentTerm) {
      setLocalContent(currentTerm.content);
      setSelectedVersion(currentTerm.version);
    } else {
      // currentTerm이 없으면 빈 내용으로 초기화
      setLocalContent("");
      setSelectedVersion("");
    }
  }, [currentTerm]);

  // 이전 버전 불러오기
  const handleLoadVersion = (version: string) => {
    const selectedTerm = currentTabTerms.find(
      (term) => term.version === version
    );
    if (selectedTerm) {
      setLocalContent(selectedTerm.content);
      setSelectedVersion(version);
      showSuccess("버전 불러오기 완료", `${version} 버전을 불러왔습니다.`);
    }
  };

  // 약관 저장
  const handleSave = async () => {
    if (!currentTerm) return;

    setIsLoading(true);
    try {
      const result = await updateTermMutation.mutateAsync({
        id: currentTerm.id,
        title: currentTerm.title,
        content: localContent,
        version: currentTerm.version,
        is_active: currentTerm.is_active,
        is_draft: currentTerm.is_draft,
      });
      showSuccess("저장 완료", result.message);
      refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("저장 실패", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 약관 활성화/비활성화
  const handleActivate = async () => {
    if (!currentTerm) return;

    setIsLoading(true);
    try {
      const result = await activateTermMutation.mutateAsync({
        termId: currentTerm.id,
        activate: !currentTerm.is_active,
      });
      showSuccess("활성화 완료", result.message);
      refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("활성화 실패", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 새 버전 생성
  const handleCreateNewVersion = async () => {
    if (!currentTerm) return;

    setIsLoading(true);
    try {
      const newVersion = (parseFloat(currentTerm.version) + 0.1).toFixed(1);
      const result = await createTermMutation.mutateAsync({
        type: currentTerm.type,
        title: currentTerm.title,
        content: localContent,
        version: newVersion,
        is_active: false,
        is_draft: true,
      });
      showSuccess("새 버전 생성 완료", result.message);
      refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("새 버전 생성 실패", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 약관 삭제
  const handleDelete = async () => {
    if (!currentTerm) return;

    // 삭제 가능 여부 확인
    if (currentTerm.is_active) {
      showError(
        "삭제 불가",
        "활성화된 약관은 삭제할 수 없습니다. 먼저 비활성화해주세요."
      );
      return;
    }
    setIsLoading(true);
    try {
      const result = await deleteTermMutation.mutateAsync(currentTerm.id);
      showSuccess("삭제 완료", result.message);
      refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("삭제 실패", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 내용 변경
  const handleContentChange = (content: string) => {
    setLocalContent(content);
  };

  // 탭 변경
  const handleTabChange = (value: string) => {
    setActiveTab(value as TermType);
    setIsPreviewMode(false);
    // 탭 변경 시 localContent 초기화
    setLocalContent("");
    setSelectedVersion("");
  };

  return {
    // 상태
    activeTab,
    isLoading,
    isPreviewMode,
    localContent,
    selectedVersion,
    termsLoading,

    // 데이터
    currentTerm,
    currentTabTerms,

    // 액션
    handleLoadVersion,
    handleSave,
    handleActivate,
    handleCreateNewVersion,
    handleDelete,
    handleContentChange,
    handleTabChange,

    // 유틸리티
    setIsPreviewMode,
  };
}
