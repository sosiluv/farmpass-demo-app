import { FarmCard } from "./FarmCard";
import type { Farm } from "@/lib/types/farm";

interface FarmsListProps {
  farms: Farm[];
  isOwner: (farm: Farm) => boolean;
  onEdit: (farm: Farm) => void;
  onDelete: (farmId: string) => void;
}

export function FarmsList({
  farms,
  isOwner,
  onEdit,
  onDelete,
}: FarmsListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {(farms || []).map((farm, index) => (
        <FarmCard
          key={farm.id}
          farm={farm}
          index={index}
          isOwner={isOwner(farm)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
