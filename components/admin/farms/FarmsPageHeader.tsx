import { PageHeader } from "@/components/layout";
import { FarmFormDialog } from "./FarmFormDialog";
import type { Farm } from "@/lib/hooks/use-farms";
import type { FarmFormValues } from "@/lib/utils/validation";

interface FarmsPageHeaderProps {
  dialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  editingFarm: Farm | null;
  onSubmit: (values: FarmFormValues) => Promise<void>;
  onAddClick: () => void;
}

export function FarmsPageHeader({
  dialogOpen,
  onDialogOpenChange,
  editingFarm,
  onSubmit,
  onAddClick,
}: FarmsPageHeaderProps) {
  return (
    <PageHeader
      title="농장 관리"
      description="등록된 농장을 관리하고 QR 코드를 생성하세요"
      breadcrumbs={[{ label: "농장 관리" }]}
      actions={
        <FarmFormDialog
          open={dialogOpen}
          onOpenChange={onDialogOpenChange}
          editingFarm={editingFarm}
          onSubmit={onSubmit}
          onAddClick={onAddClick}
        />
      }
    />
  );
}
