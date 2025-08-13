import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { FarmFormSheet } from "./FarmFormSheet";
import type { Farm } from "@/lib/types/common";
import type { FarmFormValues } from "@/lib/utils/validation";
import { PAGE_HEADER } from "@/lib/constants/farms";

interface FarmsPageHeaderProps {
  sheetOpen: boolean;
  onSheetOpenChange: (open: boolean) => void;
  editingFarm: Farm | null;
  onSubmit: (values: FarmFormValues) => Promise<void>;
  onAddClick: () => void;
  isLoading?: boolean;
}

export function FarmsPageHeader({
  sheetOpen,
  onSheetOpenChange,
  editingFarm,
  onSubmit,
  onAddClick,
  isLoading = false,
}: FarmsPageHeaderProps) {
  return (
    <PageHeader
      title={PAGE_HEADER.FARMS_PAGE_TITLE}
      description={PAGE_HEADER.FARMS_PAGE_DESCRIPTION}
      icon={Building2}
      actions={
        <FarmFormSheet
          open={sheetOpen}
          onOpenChange={onSheetOpenChange}
          editingFarm={editingFarm}
          onSubmit={onSubmit}
          onAddClick={onAddClick}
          isLoading={isLoading}
        />
      }
    />
  );
}
