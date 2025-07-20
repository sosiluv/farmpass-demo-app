import { PageHeader } from "@/components/layout";
import { FarmFormDialog } from "./FarmFormDialog";
import type { Farm } from "@/lib/types/farm";
import type { FarmFormValues } from "@/lib/utils/validation";
import { PAGE_HEADER } from "@/lib/constants/farms";

interface FarmsPageHeaderProps {
  dialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  editingFarm: Farm | null;
  onSubmit: (values: FarmFormValues) => Promise<void>;
  onAddClick: () => void;
  isLoading?: boolean;
}

export function FarmsPageHeader({
  dialogOpen,
  onDialogOpenChange,
  editingFarm,
  onSubmit,
  onAddClick,
  isLoading = false,
}: FarmsPageHeaderProps) {
  return (
    <PageHeader
      title={PAGE_HEADER.FARMS_PAGE_TITLE}
      description={PAGE_HEADER.FARMS_PAGE_DESCRIPTION}
      breadcrumbs={[{ label: PAGE_HEADER.FARMS_BREADCRUMB }]}
      actions={
        <FarmFormDialog
          open={dialogOpen}
          onOpenChange={onDialogOpenChange}
          editingFarm={editingFarm}
          onSubmit={onSubmit}
          onAddClick={onAddClick}
          isLoading={isLoading}
        />
      }
    />
  );
}
