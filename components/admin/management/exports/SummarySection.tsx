import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface SummarySectionProps {
  message: string;
  color?: "blue" | "green" | "orange" | "purple";
}

export function SummarySection({
  message,
  color = "orange",
}: SummarySectionProps) {
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
      <CardContent className="pt-3 md:pt-4">
        <div className="flex items-center space-x-1.5">
          <AlertCircle className="h-4 w-4" />
          <span className="text-base md:text-lg font-medium">{message}</span>
        </div>
      </CardContent>
    </Card>
  );
}
