"use client";

import { memo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  LABELS,
  PLACEHOLDERS,
  MEMBER_ROLE_OPTIONS,
} from "@/lib/constants/farms";

interface AddMemberRoleFieldProps {
  field: any; // React Hook Form field
  error?: string;
  showFormMessage?: boolean;
  disabled?: boolean;
}

const AddMemberRoleFieldComponent = ({
  field,
  error,
  showFormMessage = true,
  disabled = false,
}: AddMemberRoleFieldProps) => {
  return (
    <FormItem>
      <FormLabel className="text-gray-800">
        {LABELS.MEMBER_ROLE} <span className="text-red-500">*</span>
      </FormLabel>
      <FormControl>
        <Select
          value={field.value}
          onValueChange={field.onChange}
          disabled={disabled}
        >
          <SelectTrigger
            id="member-role-select"
            className={`h-12 ${error ? "border-red-500" : ""}`}
          >
            <SelectValue placeholder={PLACEHOLDERS.MEMBER_ROLE_PLACEHOLDER} />
          </SelectTrigger>
          <SelectContent>
            {MEMBER_ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      {showFormMessage && <FormMessage />}
      {error && <p className="text-red-500">{error}</p>}
    </FormItem>
  );
};

export const AddMemberRoleField = memo(AddMemberRoleFieldComponent);

AddMemberRoleField.displayName = "AddMemberRoleField";
