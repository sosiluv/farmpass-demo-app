import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

type LogLevel = "error" | "warn" | "info" | "debug";

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
  const options: { value: LogLevel; label: string; description: string }[] = [
    {
      value: "error",
      label: "Error",
      description: "오류만 기록",
    },
    {
      value: "warn",
      label: "Warning",
      description: "경고 이상 기록",
    },
    {
      value: "info",
      label: "Info",
      description: "정보 이상 기록 (기본값)",
    },
    {
      value: "debug",
      label: "Debug",
      description: "모든 로그 기록",
    },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">로깅 레벨</Label>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger className="w-full text-center">
          <SelectValue placeholder="로그 레벨 선택">
            {options.find((option) => option.value === value)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="!p-2"
            >
              <div className="flex flex-col items-start">
                <span className="font-medium leading-tight">
                  {option.label}
                </span>
                <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {option.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value === "debug" && (
        <div className="flex items-center gap-1 text-xs text-orange-600">
          <AlertTriangle className="h-3 w-3" />
          <span>디버그 모드는 성능에 영향을 줄 수 있습니다.</span>
        </div>
      )}
    </div>
  );
}
