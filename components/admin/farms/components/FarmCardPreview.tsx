import { FarmMembersPreview } from "../members/farm-members-preview";
import type { MemberWithProfile } from "@/lib/hooks/use-farm-members-preview-safe";

interface FarmMembersData {
  count: number;
  members: MemberWithProfile[];
  loading: boolean;
}

interface FarmCardPreviewProps {
  farmId: string;
  membersData: FarmMembersData;
}

export function FarmCardPreview({ farmId, membersData }: FarmCardPreviewProps) {
  return <FarmMembersPreview farmId={farmId} membersData={membersData} />;
}
