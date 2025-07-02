import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LoggingRetentionSelectProps {
  value: number;
  onChange: (value: number) => void;
  isLoading: boolean;
}

export function LoggingRetentionSelect({
  value,
  onChange,
  isLoading,
}: LoggingRetentionSelectProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">로그 보관 기간</Label>
      <Select
        value={value.toString()}
        onValueChange={(val) => onChange(parseInt(val))}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder="보관 기간을 선택하세요" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">7일</SelectItem>
          <SelectItem value="14">14일</SelectItem>
          <SelectItem value="30">30일</SelectItem>
          <SelectItem value="60">60일</SelectItem>
          <SelectItem value="90">90일</SelectItem>
          <SelectItem value="180">180일</SelectItem>
          <SelectItem value="365">365일</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {value}일이 지난 로그는 자동으로 삭제됩니다
      </p>
    </div>
  );
}
