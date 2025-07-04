/**
 * 멤버 관리 액션 통합 유틸리티
 * Quick Action(승격/강등/삭제) 로직 중앙화
 */

// import { apiClient } from "@/lib/utils/api/api-client";

export type MemberRole = "owner" | "manager" | "viewer";

export interface MemberActionResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface BulkActionResult {
  success: number;
  failed: number;
  results: MemberActionResult[];
}

/**
 * 단일 멤버 역할 변경
 */
export async function updateMemberRole(
  farmId: string,
  memberId: string,
  newRole: "manager" | "viewer"
): Promise<MemberActionResult> {
  try {
    const response = await fetch(`/api/farms/${farmId}/members/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (!response.ok) throw new Error("권한 변경 중 오류가 발생했습니다.");
    // 성공 시 별도 데이터 파싱 불필요
    return {
      success: true,
      message: `권한이 ${
        newRole === "manager" ? "관리자" : "조회자"
      }로 변경되었습니다.`,
    };
  } catch (error) {
    return {
      success: false,
      message: "권한 변경 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 단일 멤버 삭제
 */
export async function removeMember(
  farmId: string,
  memberId: string
): Promise<MemberActionResult> {
  try {
    const response = await fetch(`/api/farms/${farmId}/members/${memberId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("구성원 삭제 중 오류가 발생했습니다.");
    return {
      success: true,
      message: "구성원이 삭제되었습니다.",
    };
  } catch (error) {
    return {
      success: false,
      message: "구성원 삭제 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 멤버 승격 (조회자 → 관리자)
 */
export async function promoteMember(
  farmId: string,
  memberId: string
): Promise<MemberActionResult> {
  return updateMemberRole(farmId, memberId, "manager");
}

/**
 * 멤버 강등 (관리자 → 조회자)
 */
export async function demoteMember(
  farmId: string,
  memberId: string
): Promise<MemberActionResult> {
  return updateMemberRole(farmId, memberId, "viewer");
}

/**
 * 일괄 멤버 승격
 */
export async function bulkPromoteMembers(
  farmId: string,
  memberIds: string[]
): Promise<BulkActionResult> {
  const results: MemberActionResult[] = [];
  let success = 0;
  let failed = 0;

  for (const memberId of memberIds) {
    const result = await promoteMember(farmId, memberId);
    results.push(result);

    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed, results };
}

/**
 * 일괄 멤버 강등
 */
export async function bulkDemoteMembers(
  farmId: string,
  memberIds: string[]
): Promise<BulkActionResult> {
  const results: MemberActionResult[] = [];
  let success = 0;
  let failed = 0;

  for (const memberId of memberIds) {
    const result = await demoteMember(farmId, memberId);
    results.push(result);

    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed, results };
}

/**
 * 일괄 멤버 삭제
 */
export async function bulkRemoveMembers(
  farmId: string,
  memberIds: string[]
): Promise<BulkActionResult> {
  const results: MemberActionResult[] = [];
  let success = 0;
  let failed = 0;

  for (const memberId of memberIds) {
    const result = await removeMember(farmId, memberId);
    results.push(result);

    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed, results };
}

/**
 * 역할별 액션 가능성 체크
 */
export function canPromote(role: MemberRole): boolean {
  return role === "viewer";
}

export function canDemote(role: MemberRole): boolean {
  return role === "manager";
}

export function canDelete(role: MemberRole): boolean {
  return role !== "owner";
}

/**
 * 액션 결과를 토스트 메시지로 변환
 */
export function getActionMessage(
  action: "promote" | "demote" | "delete",
  result: MemberActionResult
): { title: string; description: string; variant: "default" | "destructive" } {
  if (result.success) {
    const actionText = {
      promote: "승격",
      demote: "강등",
      delete: "삭제",
    };

    return {
      title: `${actionText[action]} 완료`,
      description: result.message,
      variant: "default",
    };
  } else {
    return {
      title: "작업 실패",
      description: result.error || result.message,
      variant: "destructive",
    };
  }
}

/**
 * 일괄 액션 결과를 토스트 메시지로 변환
 */
export function getBulkActionMessage(
  action: "promote" | "demote" | "delete",
  result: BulkActionResult
): { title: string; description: string; variant: "default" | "destructive" } {
  const actionText = {
    promote: "승격",
    demote: "강등",
    delete: "삭제",
  };

  if (result.failed === 0) {
    return {
      title: `일괄 ${actionText[action]} 완료`,
      description: `${result.success}명의 구성원이 성공적으로 ${actionText[action]}되었습니다.`,
      variant: "default",
    };
  } else if (result.success === 0) {
    return {
      title: `일괄 ${actionText[action]} 실패`,
      description: `모든 작업이 실패했습니다. (실패: ${result.failed}명)`,
      variant: "destructive",
    };
  } else {
    return {
      title: `일괄 ${actionText[action]} 부분 완료`,
      description: `성공: ${result.success}명, 실패: ${result.failed}명`,
      variant: "default",
    };
  }
}

// =================================
// 구성원 정렬 및 표시 유틸리티 (sort-members.ts 통합)
// =================================

export interface MemberWithRole {
  role: string;
  created_at: string;
  [key: string]: any;
}

/**
 * 구성원을 권한별 우선순위로 정렬하는 함수
 * @param members 정렬할 구성원 배열
 * @returns 정렬된 구성원 배열
 */
export function sortMembersByRole<T extends MemberWithRole>(members: T[]): T[] {
  return members.sort((a, b) => {
    // 권한별 우선순위 정의
    const roleOrder: Record<string, number> = {
      owner: 1, // 🛡️ 농장 소유자 (최우선)
      manager: 2, // 👨‍💼 관리자
      viewer: 3, // 👁️ 조회자
    };

    const aOrder = roleOrder[a.role] || 999; // 알 수 없는 권한은 맨 뒤로
    const bOrder = roleOrder[b.role] || 999;

    // 권한이 다르면 권한 순서로 정렬
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    // 같은 권한이면 생성일 순서로 정렬 (먼저 가입한 사람이 위로)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/**
 * 권한별 우선순위 숫자 반환
 * @param role 권한 문자열
 * @returns 우선순위 숫자 (낮을수록 높은 우선순위)
 */
export function getRolePriority(role: string): number {
  const roleOrder: Record<string, number> = {
    owner: 1,
    manager: 2,
    viewer: 3,
  };
  return roleOrder[role] || 999;
}

/**
 * 권한별 표시 이름 반환
 * @param role 권한 문자열
 * @returns 한글 권한명
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    owner: "농장 소유자",
    manager: "관리자",
    viewer: "조회자",
  };
  return roleNames[role] || role;
}

/**
 * 권한별 이모지 반환
 * @param role 권한 문자열
 * @returns 권한 이모지
 */
export function getRoleEmoji(role: string): string {
  const roleEmojis: Record<string, string> = {
    owner: "🛡️",
    manager: "👨‍💼",
    viewer: "👁️",
  };
  return roleEmojis[role] || "👤";
}
