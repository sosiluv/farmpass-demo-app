import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Loader2 } from "lucide-react";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { apiClient } from "@/lib/utils/data/api-client";
import { BUTTONS, LABELS } from "@/lib/constants/farms";
import {
  AddMemberDialogHeader,
  AddMemberEmailField,
  AddMemberRoleField,
} from "./components";

interface AddMemberDialogProps {
  canManageMembers: boolean;
  onAddMember: (email: string, role: "manager" | "viewer") => Promise<void>;
  farmId: string;
}

export function AddMemberDialog({
  canManageMembers,
  onAddMember,
  farmId,
}: AddMemberDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "viewer">("viewer");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 사용자 검색 기능
  useEffect(() => {
    const searchUsers = async () => {
      // 최소 2글자부터 검색 (이메일 검색의 경우 적절한 최소 길이)
      if (!searchTerm.trim() || searchTerm.length < 7) {
        setAvailableUsers([]);
        return;
      }

      try {
        // API 라우트를 통해 사용자 검색 (농장 구성원 제외)
        const searchResult = await apiClient(
          `/api/users/search?q=${encodeURIComponent(
            searchTerm
          )}&farmId=${farmId}`,
          {
            method: "GET",
            context: "사용자 검색",
          }
        );

        setAvailableUsers(searchResult.users || []);
      } catch (error) {
        // 에러는 이미 onError에서 처리됨
        setAvailableUsers([]);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, farmId]);

  // 사용자 선택 핸들러
  const handleUserSelect = useCallback((user: any) => {
    setEmail(user.email);
    setSearchTerm(user.email);
    // 검색 결과를 즉시 숨김
    setAvailableUsers([]);
  }, []);

  // 검색어 변경 핸들러 (직접 입력 시)
  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
    setEmail(value); // 직접 입력 시에도 email 상태 업데이트
  }, []);

  const handleAddMember = async () => {
    devLog.log("handleAddMember 호출됨:", { email: email.trim(), role });

    if (!email.trim()) {
      devLog.warn("이메일이 비어있음");
      return;
    }

    setIsAddingMember(true);
    try {
      await onAddMember(email.trim(), role);
      handleClose();
    } catch (error) {
      devLog.error("구성원 추가 실패:", error);
      // 에러는 부모 컴포넌트에서 처리
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEmail("");
    setRole("viewer");
    setSearchTerm("");
    setAvailableUsers([]);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={!canManageMembers}
          className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm px-3 sm:px-4"
        >
          <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">{BUTTONS.ADD_MEMBER}</span>
          <span className="sm:hidden">{BUTTONS.ADD_MEMBER_SHORT}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[350px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-3 sm:p-4 md:p-6">
        <AddMemberDialogHeader />
        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          <AddMemberEmailField
            searchTerm={searchTerm}
            onSearchTermChange={handleSearchTermChange}
            availableUsers={availableUsers}
            onUserSelect={handleUserSelect}
          />
          <AddMemberRoleField role={role} onRoleChange={setRole} />
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isAddingMember}
            className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
          >
            {BUTTONS.CANCEL_BUTTON}
          </Button>
          <Button
            onClick={handleAddMember}
            disabled={isAddingMember}
            className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
          >
            {isAddingMember ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {BUTTONS.REGISTERING_LOADING}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                {BUTTONS.REGISTER_BUTTON}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
