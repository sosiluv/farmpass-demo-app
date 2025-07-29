import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import {
  LABELS,
  PLACEHOLDERS,
  LOGGING_LEVEL_OPTIONS,
} from "@/lib/constants/settings";
import type { LogLevel } from "@/lib/types/common";

interface LoggingLevelSelectProps {
  value: LogLevel;
  onChange: (value: LogLevel) => void;
  isLoading?: boolean;
}

export function LoggingLevelSelect({
  value,
  onChange,
  isLoading,
}: LoggingLevelSelectProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor="logging-level"
        className="text-sm sm:text-base font-medium"
      >
        {LABELS.LOGGING_LEVEL}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger
          id="logging-level"
          className="w-full text-center text-sm sm:text-base"
        >
          <SelectValue placeholder={PLACEHOLDERS.LOGGING_LEVEL}>
            {
              LOGGING_LEVEL_OPTIONS.find((option) => option.value === value)
                ?.label
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LOGGING_LEVEL_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="!p-2 text-sm sm:text-base"
            >
              <div className="flex flex-col items-start">
                <span className="font-medium leading-tight text-sm sm:text-base">
                  {option.label}
                </span>
                <span className="text-sm sm:text-base text-muted-foreground leading-tight mt-0.5">
                  {option.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value === "debug" && (
        <div className="flex items-center gap-1 text-sm sm:text-base text-orange-600">
          <AlertTriangle className="h-3 w-3" />
          <span>{LABELS.LOGGING_DEBUG_WARNING}</span>
        </div>
      )}
    </div>
  );
}
