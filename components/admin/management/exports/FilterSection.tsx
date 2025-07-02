import React from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSectionProps {
  title?: string;
  color?: "blue" | "green" | "orange" | "purple";
  filters: Array<{
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }>;
}

export function FilterSection({
  title = "필터 설정",
  color = "green",
  filters,
}: FilterSectionProps) {
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50/50 text-blue-700",
    green: "border-green-200 bg-green-50/50 text-green-700",
    orange: "border-orange-200 bg-orange-50/50 text-orange-700",
    purple: "border-purple-200 bg-purple-50/50 text-purple-700",
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardHeader className="pb-1.5 sm:pb-2 md:pb-3">
        <CardTitle className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm md:text-base">
          <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {filters.map((filter) => (
            <div key={filter.key} className="space-y-1 sm:space-y-1.5">
              <Label className="text-[10px] sm:text-xs md:text-sm font-medium">
                {filter.label}
              </Label>
              <Select value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className="h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
