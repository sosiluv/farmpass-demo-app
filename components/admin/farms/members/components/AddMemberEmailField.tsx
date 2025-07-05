import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

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
      <Label className="text-xs sm:text-sm">이메일</Label>
      <div className="relative">
        <Input
          placeholder="이메일 주소 입력"
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
            {availableUsers.map((user) => (
              <div
                key={user.id}
                className="p-2 sm:p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                onClick={() => onUserSelect(user)}
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
