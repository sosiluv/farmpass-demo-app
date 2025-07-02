import { FarmCard } from "./FarmCard";
import type { Farm } from "@/lib/hooks/use-farms";
import type { MemberWithProfile } from "@/lib/hooks/use-farm-members-preview-safe";

interface FarmMembersData {
  count: number;
  members: MemberWithProfile[];
  loading: boolean;
}

interface FarmsListProps {
  farms: Farm[];
  isOwner: (farm: Farm) => boolean;
  onEdit: (farm: Farm) => void;
  onDelete: (farmId: string) => void;
  farmMembersData: Record<string, FarmMembersData>;
}

export function FarmsList({
  farms,
  isOwner,
  onEdit,
  onDelete,
  farmMembersData,
}: FarmsListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {farms.map((farm, index) => (
        <FarmCard
          key={farm.id}
          farm={farm}
          index={index}
          isOwner={isOwner(farm)}
          onEdit={onEdit}
          onDelete={onDelete}
          membersData={
            farmMembersData[farm.id] || {
              count: 0,
              members: [],
              loading: false,
            }
          }
        />
      ))}
    </div>
  );
}
