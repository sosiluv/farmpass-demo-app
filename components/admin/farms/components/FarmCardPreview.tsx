import { FarmMembersPreview } from "../members/farm-members-preview";
import type { FarmMember } from "@/lib/types/common";

interface FarmCardPreviewProps {
  farmId: string;
  membersData?: Array<
    FarmMember & {
      profiles: {
        name: string;
      };
    }
  >;
}

export function FarmCardPreview({ farmId, membersData }: FarmCardPreviewProps) {
  return <FarmMembersPreview farmId={farmId} membersData={membersData} />;
}
