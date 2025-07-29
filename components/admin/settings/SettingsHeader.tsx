import { Button } from "@/components/ui/button";
import { Check, Loader2, Settings } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { LABELS, PAGE_HEADER, BUTTONS } from "@/lib/constants/settings";

interface SettingsHeaderProps {
  saving: boolean;
  unsavedChanges: boolean;
  onSave: () => void;
}

export function SettingsHeader({
  saving,
  unsavedChanges,
  onSave,
}: SettingsHeaderProps) {
  const saveButton = (
    <Button
      onClick={onSave}
      disabled={saving || !unsavedChanges}
      className="flex items-center"
    >
      {saving ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {BUTTONS.SAVING}
        </>
      ) : (
        <>
          <Check className="w-4 h-4 mr-2" />
          {BUTTONS.SAVE_SETTINGS}
        </>
      )}
    </Button>
  );

  return (
    <PageHeader
      title={PAGE_HEADER.PAGE_TITLE}
      description={PAGE_HEADER.PAGE_DESCRIPTION}
      icon={Settings}
      actions={saveButton}
    />
  );
}
