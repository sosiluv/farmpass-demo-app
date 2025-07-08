import { FarmMembersPreview } from "../members/farm-members-preview";
import type { FarmMembers } from "@/lib/hooks/query/use-farm-members-query";

interface FarmCardPreviewProps {
  farmId: string;
  membersData?: FarmMembers;
}

export function FarmCardPreview({ farmId, membersData }: FarmCardPreviewProps) {
  return <FarmMembersPreview farmId={farmId} membersData={membersData} />;
}
