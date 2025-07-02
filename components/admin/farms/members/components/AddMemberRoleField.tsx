import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AddMemberRoleFieldProps {
  role: "manager" | "viewer";
  onRoleChange: (role: "manager" | "viewer") => void;
}

export function AddMemberRoleField({
  role,
  onRoleChange,
}: AddMemberRoleFieldProps) {
  return (
    <div className="space-y-1 sm:space-y-2">
      <Label className="text-xs sm:text-sm">권한</Label>
      <Select value={role} onValueChange={(value: any) => onRoleChange(value)}>
        <SelectTrigger className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm">
          <SelectValue placeholder="권한 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="manager" className="text-xs sm:text-sm">
            관리자
          </SelectItem>
          <SelectItem value="viewer" className="text-xs sm:text-sm">
            조회자
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
