"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, X } from "lucide-react";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/farms";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AddMemberEmailFieldProps {
  field: any; // React Hook Form field
  availableUsers?: User[];
  onUserSelect?: (user: User) => void;
  error?: string;
  showFormMessage?: boolean;
  disabled?: boolean;
}

const AddMemberEmailFieldComponent = ({
  field,
  availableUsers = [],
  onUserSelect,
  error,
  showFormMessage = true,
  disabled = false,
}: AddMemberEmailFieldProps) => {
  return (
    <FormItem>
      <FormLabel className="text-gray-800">
        {LABELS.MEMBER_EMAIL} <span className="text-red-500">*</span>
      </FormLabel>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormControl>
          <Input
            {...field}
            type="email"
            placeholder={PLACEHOLDERS.MEMBER_EMAIL_PLACEHOLDER}
            className={`h-12 pl-10 ${error ? "border-red-500" : ""}`}
            disabled={disabled}
          />
        </FormControl>

        {/* 검색어 초기화 버튼 */}
        {field.value && (
          <Button
            variant="ghost"
            onClick={() => field.onChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Button>
        )}

        {/* 사용자 검색 드롭다운 */}
        {availableUsers.length > 0 && (
          <div className="absolute w-full mt-1 bg-white border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
            {availableUsers.map((user) => (
              <div
                key={user.id}
                className="p-2 sm:p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors duration-150"
                onClick={() => {
                  onUserSelect?.(user);
                  field.onChange(user.email);
                  // input에서 포커스 제거
                  (document.activeElement as HTMLElement)?.blur();
                }}
              >
                <div className="font-medium text-gray-500 truncate">
                  {user.name}
                </div>
                <div className="text-gray-500 truncate">{user.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showFormMessage && <FormMessage />}
      {error && <p className="text-red-500">{error}</p>}
    </FormItem>
  );
};

export const AddMemberEmailField = memo(AddMemberEmailFieldComponent);

AddMemberEmailField.displayName = "AddMemberEmailField";
