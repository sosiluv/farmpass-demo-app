import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Plus, Loader2 } from "lucide-react";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import { BUTTONS } from "@/lib/constants/visitor";

interface FormFooterProps {
  isSubmitting: boolean;
  error?: string | null;
  formErrors?: any;
  onSubmit: (data: VisitorFormData) => Promise<void>;
}

export const FormFooter = ({
  isSubmitting,
  error,
  formErrors,
  onSubmit,
}: FormFooterProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 에러 표시 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 폼 에러 표시 */}
      {formErrors?.root && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{formErrors.root.message}</AlertDescription>
        </Alert>
      )}

      {/* 제출 버튼 */}
      <Button
        type="submit"
        className="w-full h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md hover:from-blue-600 hover:to-indigo-600 transition-colors mt-4 sm:mt-6"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {BUTTONS.FORM_FOOTER_REGISTERING}
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            {BUTTONS.FORM_FOOTER_REGISTER_VISIT}
          </>
        )}
      </Button>
    </div>
  );
};
