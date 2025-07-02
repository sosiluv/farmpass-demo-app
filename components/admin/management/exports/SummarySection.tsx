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
    blue: "border-blue-200 bg-blue-50/50 text-blue-700",
    green: "border-green-200 bg-green-50/50 text-green-700",
    orange: "border-orange-200 bg-orange-50/50 text-orange-700",
    purple: "border-purple-200 bg-purple-50/50 text-purple-700",
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardContent className="pt-2 sm:pt-3 md:pt-4">
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-[10px] sm:text-xs md:text-sm font-medium">
            {message}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
