import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/farms";

interface AddMemberEmailFieldProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  availableUsers: any[];
  onUserSelect: (user: any) => void;
}

export function AddMemberEmailField({
  searchTerm,
  onSearchTermChange,
  availableUsers,
  onUserSelect,
}: AddMemberEmailFieldProps) {
  return (
    <div className="space-y-1 sm:space-y-2">
      <Label htmlFor="member-email-search" className="text-xs sm:text-sm">
        {LABELS.MEMBER_EMAIL}
      </Label>
      <div className="relative">
        <Input
          id="member-email-search"
          name="member-email-search"
          placeholder={PLACEHOLDERS.MEMBER_EMAIL_PLACEHOLDER}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchTermChange("")}
            className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Button>
        )}
        {availableUsers.length > 0 && (
          <div className="absolute w-full mt-1 bg-white border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
            {(availableUsers || []).map((user) => (
              <div
                key={user.id}
                className="p-2 sm:p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors duration-150"
                onClick={() => {
                  onUserSelect(user);
                  // input에서 포커스 제거
                  (document.activeElement as HTMLElement)?.blur();
                }}
              >
                <div className="font-medium text-xs sm:text-sm text-gray-500 truncate">
                  {user.name}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">
                  {user.email}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
