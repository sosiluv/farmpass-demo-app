import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Database } from "lucide-react";
import { BUTTONS } from "@/lib/constants/management";

interface ExportDialogWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  buttonText: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
}

export function ExportDialogWrapper({
  open,
  onOpenChange,
  title,
  description,
  buttonText,
  children,
  trigger,
}: ExportDialogWrapperProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1 sm:space-x-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{buttonText}</span>
            <span className="sm:hidden">{BUTTONS.CSV_EXPORT}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[350px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] max-h-[90vh] sm:max-h-[95vh] overflow-y-auto p-3 sm:p-4 md:p-6">
        <DialogHeader className="pb-2 sm:pb-3 md:pb-4">
          <DialogTitle className="flex items-center space-x-1.5 sm:space-x-2 text-sm sm:text-base md:text-lg">
            <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10">
              <Database className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
