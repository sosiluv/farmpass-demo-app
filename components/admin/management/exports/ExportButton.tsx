import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BUTTONS } from "@/lib/constants/management";

interface ExportButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function ExportButton({
  onClick,
  children,
  disabled,
}: ExportButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled} variant="outline">
      <Download className="w-4 h-4 mr-2" />
      {children || BUTTONS.CSV_EXPORT}
    </Button>
  );
}
