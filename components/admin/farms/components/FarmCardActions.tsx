import { Button } from "@/components/ui/button";
import { FarmQRCode } from "../farm-qr-code";
import { Edit, Trash2, Users } from "lucide-react";
import type { Farm } from "@/lib/hooks/use-farms";
import Link from "next/link";

interface FarmCardActionsProps {
  farm: Farm;
  isOwner: boolean;
  onEdit: (farm: Farm) => void;
  onDelete: (farmId: string) => void;
}

export function FarmCardActions({
  farm,
  isOwner,
  onEdit,
  onDelete,
}: FarmCardActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* 첫 번째 줄: 주요 액션 */}
      <div className="flex gap-2">
        <FarmQRCode farmId={farm.id} farmName={farm.farm_name} />
        <Button variant="outline" size="sm" className="flex-1 min-w-0" asChild>
          <Link
            href={`/admin/farms/${farm.id}/members`}
            className="flex items-center justify-center gap-2"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">구성원</span>
          </Link>
        </Button>
      </div>

      {/* 두 번째 줄: 관리 액션 (소유자만) */}
      {isOwner && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(farm)}
            className="flex-1 min-w-0"
            title="농장 정보 수정"
          >
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">수정</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(farm.id)}
            className="flex-1 min-w-0 text-red-600 hover:text-red-700"
            title="농장 삭제"
          >
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">삭제</span>
          </Button>
        </div>
      )}
    </div>
  );
}
