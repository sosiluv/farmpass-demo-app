import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { LABELS } from "@/lib/constants/management";

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
  title = LABELS.EXPORT_OPTIONS,
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
        <CardTitle className="flex items-center justify-between text-base md:text-lg">
          <div className="flex items-center space-x-1.5">
            <Settings className="h-4 w-4" />
            <span>{title}</span>
          </div>
          <Badge variant="secondary" className="text-sm">
            {LABELS.SELECTED_COUNT.replace(
              "{selectedCount}",
              selectedCount.toString()
            ).replace("{totalCount}", totalCount.toString())}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(options || []).map((option) => (
            <div key={option.key} className="flex items-start space-x-2">
              <Checkbox
                id={option.key}
                checked={option.checked}
                onCheckedChange={(checked) => option.onChange(checked === true)}
                className="mt-3"
              />
              <div className="space-y-0.5">
                <Label
                  htmlFor={option.key}
                  className="text-sm md:text-base font-medium cursor-pointer"
                >
                  {option.label}
                </Label>
                {option.description && (
                  <p className="text-sm md:text-base text-muted-foreground">
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
