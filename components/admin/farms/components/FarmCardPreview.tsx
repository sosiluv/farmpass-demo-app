import { FarmMembersPreview } from "../members/farm-members-preview";

interface FarmCardPreviewProps {
  farmId: string;
}

export function FarmCardPreview({ farmId }: FarmCardPreviewProps) {
  return <FarmMembersPreview farmId={farmId} />;
}
