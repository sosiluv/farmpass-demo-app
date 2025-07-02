import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  AddMemberDialogHeader,
  AddMemberEmailField,
  AddMemberRoleField,
} from "./components";

interface AddMemberDialogProps {
  canManageMembers: boolean;
  onAddMember: (email: string, role: "manager" | "viewer") => Promise<void>;
}

export function AddMemberDialog({
  canManageMembers,
  onAddMember,
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
      if (!searchTerm.trim()) {
        setAvailableUsers([]);
        return;
      }

      try {
        const { data: users, error } = await supabase
          .from("profiles")
          .select("id, email, name")
          .ilike("email", `%${searchTerm}%`)
          .limit(5);

        if (error) throw error;
        setAvailableUsers(users || []);
      } catch (error) {
        devLog.error("사용자 검색 오류:", error);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // 사용자 선택 핸들러
  const handleUserSelect = useCallback((user: any) => {
    setEmail(user.email);
    setSearchTerm(user.email);
    setAvailableUsers([]);
  }, []);

  const handleAddMember = async () => {
    if (!email.trim()) return;

    setIsAddingMember(true);
    try {
      await onAddMember(email.trim(), role);
      handleClose();
    } catch (error) {
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
          <span className="hidden sm:inline">구성원 추가</span>
          <span className="sm:hidden">추가</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[350px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-3 sm:p-4 md:p-6">
        <AddMemberDialogHeader />
        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          <AddMemberEmailField
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            availableUsers={availableUsers}
            onUserSelect={handleUserSelect}
          />
          <AddMemberRoleField role={role} onRoleChange={setRole} />
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
          >
            취소
          </Button>
          <Button
            onClick={handleAddMember}
            disabled={isAddingMember}
            className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
          >
            {isAddingMember ? "추가 중..." : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
