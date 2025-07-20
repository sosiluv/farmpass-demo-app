import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  LABELS,
  PLACEHOLDERS,
  MEMBER_ROLE_OPTIONS,
} from "@/lib/constants/farms";

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
      <Label htmlFor="member-role-select" className="text-xs sm:text-sm">
        {LABELS.MEMBER_ROLE}
      </Label>
      <Select value={role} onValueChange={(value: any) => onRoleChange(value)}>
        <SelectTrigger
          id="member-role-select"
          className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
        >
          <SelectValue placeholder={PLACEHOLDERS.MEMBER_ROLE_PLACEHOLDER} />
        </SelectTrigger>
        <SelectContent>
          {MEMBER_ROLE_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-xs sm:text-sm"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
