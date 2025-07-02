"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function RefreshButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full text-gray-500 hover:text-gray-700"
      onClick={() => window.location.reload()}
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      상태 새로고침
    </Button>
  );
}
