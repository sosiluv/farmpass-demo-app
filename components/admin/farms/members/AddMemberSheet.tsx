import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormField } from "@/components/ui/form";
import {
  CommonSheetHeader,
  CommonSheetFooter,
  CommonSheetContent,
} from "@/components/ui/sheet-common";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, Loader2 } from "lucide-react";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { apiClient } from "@/lib/utils/data/api-client";
import { BUTTONS, PAGE_HEADER, LABELS } from "@/lib/constants/farms";
import { AddMemberEmailField, AddMemberRoleField } from "./components";
import useBlockNavigation from "@/hooks/ui/use-before-unload";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";

interface AddMemberFormData {
  email: string;
  role: "manager" | "viewer";
}

interface AddMemberSheetProps {
  canManageMembers: boolean;
  onAddMember: (email: string, role: "manager" | "viewer") => Promise<void>;
  farmId: string;
}

export function AddMemberSheet({
  canManageMembers,
  onAddMember,
  farmId,
}: AddMemberSheetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const form = useForm<AddMemberFormData>({
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });
  const { watch, setValue } = form;
  const email = watch("email");

  const handleSheetClose = useCallback(() => {
    setShowConfirmSheet(false);
    setSheetOpen(false);
    setAvailableUsers([]);
  }, []);

  // 뒤로가기 처리 - useBlockNavigation 훅 사용
  const { isAttemptingNavigation, proceedNavigation, cancelNavigation } =
    useBlockNavigation(sheetOpen, false, showConfirmSheet, handleSheetClose);
  // confirm 다이얼로그 처리
  useEffect(() => {
    if (isAttemptingNavigation) {
      setShowConfirmSheet(true);
    }
  }, [isAttemptingNavigation]);

  // 사용자 검색 기능
  useEffect(() => {
    const searchUsers = async () => {
      // 최소 2글자부터 검색 (이메일 검색의 경우 적절한 최소 길이)
      if (!email?.trim() || email.length < 7) {
        setAvailableUsers([]);
        return;
      }

      try {
        // API 라우트를 통해 사용자 검색 (농장 구성원 제외)
        const searchResult = await apiClient(
          `/api/users/search?q=${encodeURIComponent(email)}&farmId=${farmId}`,
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
  }, [email, farmId]);

  // 사용자 선택 핸들러
  const handleUserSelect = useCallback(
    (user: any) => {
      setValue("email", user.email);
      // 검색 결과를 즉시 숨김
      setAvailableUsers([]);
    },
    [setValue]
  );

  const handleAddMember = async (data: AddMemberFormData) => {
    if (!data.email.trim()) {
      return;
    }

    setIsAddingMember(true);
    try {
      await onAddMember(data.email.trim(), data.role);
      handleSheetClose();
    } catch (error) {
      devLog.error("구성원 추가 실패:", error);
      // 에러는 부모 컴포넌트에서 처리
    } finally {
      setIsAddingMember(false);
    }
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button className="text-sm sm:text-base" disabled={!canManageMembers}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{BUTTONS.ADD_MEMBER}</span>
            <span className="sm:hidden">{BUTTONS.ADD_MEMBER_SHORT}</span>
          </Button>
        </SheetTrigger>
        <CommonSheetContent
          enableDragToResize={true}
          open={sheetOpen}
          onClose={handleSheetClose}
        >
          <CommonSheetHeader
            title={PAGE_HEADER.ADD_MEMBER_TITLE}
            description={PAGE_HEADER.ADD_MEMBER_DESCRIPTION}
          />
          <ScrollArea className="flex-1">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleAddMember)}
                className="space-y-4 py-4 p-3"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <AddMemberEmailField
                      field={field}
                      availableUsers={availableUsers}
                      onUserSelect={handleUserSelect}
                      disabled={isAddingMember}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <AddMemberRoleField
                      field={field}
                      disabled={isAddingMember}
                    />
                  )}
                />
              </form>
            </Form>
          </ScrollArea>
          <CommonSheetFooter
            onCancel={handleSheetClose}
            onConfirm={form.handleSubmit(handleAddMember)}
            cancelText={BUTTONS.CANCEL_BUTTON}
            confirmText={
              isAddingMember
                ? BUTTONS.REGISTERING_LOADING
                : BUTTONS.REGISTER_BUTTON
            }
            isLoading={isAddingMember}
            confirmIcon={
              isAddingMember ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )
            }
          />
        </CommonSheetContent>
      </Sheet>

      {/* 네비게이션 확인 시트 */}
      <ConfirmSheet
        open={showConfirmSheet}
        onOpenChange={setShowConfirmSheet}
        onConfirm={() => {
          proceedNavigation();
        }}
        onCancel={() => {
          setShowConfirmSheet(false);
          cancelNavigation();
        }}
        title={LABELS.ADD_MEMBER_FORM_CANCEL_TITLE}
        warningMessage={LABELS.ADD_MEMBER_FORM_CANCEL_DESCRIPTION}
        variant="warning"
      />
    </>
  );
}
