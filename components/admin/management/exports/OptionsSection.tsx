import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

interface ExportOption {
  key: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface OptionsSectionProps {
  title?: string;
  color?: "blue" | "green" | "orange" | "purple";
  options: ExportOption[];
  selectedCount: number;
  totalCount: number;
}

export function OptionsSection({
  title = "내보내기 옵션",
  color = "orange",
  options,
  selectedCount,
  totalCount,
}: OptionsSectionProps) {
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50/50 text-blue-700",
    green: "border-green-200 bg-green-50/50 text-green-700",
    orange: "border-orange-200 bg-orange-50/50 text-orange-700",
    purple: "border-purple-200 bg-purple-50/50 text-purple-700",
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardHeader className="pb-1.5 sm:pb-2 md:pb-3">
        <CardTitle className="flex items-center justify-between text-xs sm:text-sm md:text-base">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{title}</span>
          </div>
          <Badge variant="secondary" className="text-[10px] sm:text-xs">
            {selectedCount}/{totalCount} 선택됨
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {(options || []).map((option) => (
            <div
              key={option.key}
              className="flex items-start space-x-2 sm:space-x-3"
            >
              <Checkbox
                id={option.key}
                checked={option.checked}
                onCheckedChange={option.onChange}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label
                  htmlFor={option.key}
                  className="text-[10px] sm:text-xs md:text-sm font-medium cursor-pointer"
                >
                  {option.label}
                </Label>
                {option.description && (
                  <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
