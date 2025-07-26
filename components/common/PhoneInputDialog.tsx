import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PhoneField } from "@/components/visitor/form-fields/PhoneField";
import { Form } from "@/components/ui/form";
import { phoneNumberSchema } from "@/lib/utils/validation/profile-validation";
import { BUTTONS, LABELS } from "@/lib/constants/common";
import { Loader2 } from "lucide-react";
import { Phone } from "lucide-react";

const schema = z.object({
  phoneNumber: phoneNumberSchema,
});
type PhoneInputForm = z.infer<typeof schema>;

interface PhoneInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (phoneNumber: string) => void;
}

export function PhoneInputDialog({
  open,
  onOpenChange,
  onSubmit,
}: PhoneInputDialogProps) {
  const form = useForm<PhoneInputForm>({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: "" },
    mode: "onChange",
  });

  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (data: PhoneInputForm) => {
    setIsLoading(true);
    try {
      await onSubmit(data.phoneNumber);
      onOpenChange(false);
      form.reset();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent preventOutsideClose>
        <DialogHeader>
          <DialogTitle>{LABELS.PHONE_INPUT_TITLE}</DialogTitle>
          <DialogDescription>
            {LABELS.PHONE_INPUT_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <PhoneField form={form} required />
            <DialogFooter>
              <Button
                type="submit"
                disabled={!form.formState.isValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {BUTTONS.PHONE_INPUT_LOADING}
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    {BUTTONS.PHONE_INPUT_SAVE}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
