import type { TermType, TermManagement } from "./common";
// 재내보내기 (기존 코드와의 호환성을 위해)
export type { TermType, TermManagement };

// 약관 수정 요청
export interface UpdateTermRequest {
  id: string;
  title?: string;
  content?: string;
  version?: string;
  is_active?: boolean;
  is_draft?: boolean;
}

// 약관 활성화 요청
export interface ActivateTermRequest {
  termId: string;
  activate: boolean;
}
