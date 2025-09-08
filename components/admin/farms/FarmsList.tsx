import React from "react";
import { FarmCard } from "./FarmCard";
import type { Farm, FarmMember } from "@/lib/types/common";

// Farm 타입을 확장하여 멤버 정보 포함
interface FarmWithMembers extends Farm {
  farm_members?: Array<
    FarmMember & {
      profiles: {
        name: string;
      };
    }
  >;
}

interface FarmsListProps {
  farms: FarmWithMembers[];
  isOwner: (farm: FarmWithMembers) => boolean;
  onEdit: (farm: FarmWithMembers) => void;
  onDelete: (farmId: string) => void;
}

export const FarmsList = React.memo(function FarmsList({
  farms,
  isOwner,
  onEdit,
  onDelete,
}: FarmsListProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {(farms || []).map((farm, index) => (
        <FarmCard
          key={farm.id}
          farm={farm}
          index={index}
          isOwner={isOwner(farm)}
          onEdit={onEdit}
          onDelete={onDelete}
          membersData={farm.farm_members || []}
        />
      ))}
    </div>
  );
});
