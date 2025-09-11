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
import { LABELS } from "@/lib/constants/management";

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
  title = LABELS.FILTER_SETTINGS,
  color = "green",
  filters,
}: FilterSectionProps) {
  const colorClasses = {
    blue: "border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    green:
      "border-green-200 dark:border-green-800/60 bg-green-50/50 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    orange:
      "border-orange-200 dark:border-orange-800/60 bg-orange-50/50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    purple:
      "border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardHeader className="pb-1.5 sm:pb-2 md:pb-3">
        <CardTitle className="flex items-center space-x-1.5 text-base md:text-lg">
          <Filter className="h-4 w-4" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="grid grid-cols-2 gap-3">
          {(filters || []).map((filter) => (
            <div key={filter.key} className="space-y-1.5">
              <Label className="text-sm md:text-base font-medium text-gray-700 dark:text-slate-200">
                {filter.label}
              </Label>
              <Select value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600">
                  {(filter.options || []).map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
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
