import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { ReactNode } from "react";

interface CommonSelect {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}

interface CommonFiltersProps {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selects?: CommonSelect[];
  extra?: ReactNode;
}

export function CommonFilters({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  selects = [],
  extra,
}: CommonFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2 lg:gap-3 xl:gap-4 w-full">
      <div className="relative flex-1">
        <Input
          id="user-search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={onSearchChange}
          className="h-9 sm:h-10 lg:h-11 xl:h-12 w-full text-xs sm:text-sm placeholder:text-sm sm:placeholder:text-base"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onSearchChange({
                target: { value: "" },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 p-0 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
          </Button>
        )}
      </div>
      {(selects || []).map((select, idx) => (
        <Select key={idx} value={select.value} onValueChange={select.onChange}>
          <SelectTrigger
            className={
              select.className ||
              "h-9 sm:h-10 lg:h-11 xl:h-12 w-full sm:w-auto sm:min-w-[120px] lg:min-w-[140px] xl:min-w-[160px] text-xs sm:text-sm"
            }
          >
            <SelectValue placeholder={select.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {(select.options || []).map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-xs sm:text-sm"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {extra}
    </div>
  );
}
