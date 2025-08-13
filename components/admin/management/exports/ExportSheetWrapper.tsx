import React from "react";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {
  CommonSheetHeader,
  CommonSheetContent,
} from "@/components/ui/sheet-common";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportSheetWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  buttonText: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
}

export function ExportSheetWrapper({
  open,
  onOpenChange,
  title,
  description,
  buttonText,
  children,
  trigger,
}: ExportSheetWrapperProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 h-9 px-3 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
          >
            <Download className="h-4 w-4" />
            <span>{buttonText}</span>
          </Button>
        )}
      </SheetTrigger>
      <CommonSheetContent
        side="bottom"
        showHandle={true}
        enableDragToClose={true}
        dragDirection="vertical"
        dragThreshold={50}
        onClose={() => onOpenChange(false)}
      >
        <CommonSheetHeader
          title={title}
          description={description}
          show={false}
        />
        {children}
      </CommonSheetContent>
    </Sheet>
  );
}
