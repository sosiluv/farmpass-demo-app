import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout";

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
          저장 중...
        </>
      ) : (
        <>
          <Check className="w-4 h-4 mr-2" />
          설정 저장
        </>
      )}
    </Button>
  );

  return (
    <PageHeader
      title="시스템 설정"
      description="시스템의 전반적인 설정을 관리하세요"
      breadcrumbs={[{ label: "시스템 설정" }]}
      actions={saveButton}
    />
  );
}
