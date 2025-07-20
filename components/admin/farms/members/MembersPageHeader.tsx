import { Building2 } from "lucide-react";
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
      breadcrumbs={[
        {
          label: PAGE_HEADER.FARMS_BREADCRUMB,
          href: "/admin/farms",
          icon: Building2,
        },
        { label: farm.farm_name, href: `/admin/farms/${farm.id}` },
        { label: PAGE_HEADER.MEMBERS_BREADCRUMB },
      ]}
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
