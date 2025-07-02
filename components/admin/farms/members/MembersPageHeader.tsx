import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { AddMemberDialog } from "./AddMemberDialog";

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
      title="구성원 관리"
      description={`${farm.farm_name} 농장의 구성원을 관리하고 권한을 설정하세요`}
      breadcrumbs={[
        { label: "농장 관리", href: "/admin/farms", icon: Building2 },
        { label: farm.farm_name, href: `/admin/farms/${farm.id}` },
        { label: "구성원 관리" },
      ]}
      actions={
        <AddMemberDialog
          canManageMembers={canManageMembers}
          onAddMember={onAddMember}
        />
      }
    />
  );
}
