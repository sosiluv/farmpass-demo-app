import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { AddMemberDialog } from "./AddMemberDialog";
import { PAGE_HEADER } from "@/lib/constants/farms";

interface Farm {
  id: string;
  farm_name: string;
}

interface MembersPageHeaderProps {
  farm: Farm;
  canManageMembers: boolean;
  onAddMember: (email: string, role: "manager" | "viewer") => Promise<void>;
}

export function MembersPageHeader({
  farm,
  canManageMembers,
  onAddMember,
}: MembersPageHeaderProps) {
  return (
    <PageHeader
      title={PAGE_HEADER.MEMBERS_PAGE_TITLE}
      description={PAGE_HEADER.MEMBERS_PAGE_DESCRIPTION.replace(
        "{farmName}",
        farm.farm_name
      )}
      icon={Users}
      actions={
        <AddMemberDialog
          canManageMembers={canManageMembers}
          onAddMember={onAddMember}
          farmId={farm.id}
        />
      }
    />
  );
}
