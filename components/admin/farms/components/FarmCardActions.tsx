import { Button } from "@/components/ui/button";
import { FarmQRCodeSheet } from "../FarmQRCodeSheet";
import { Edit, Trash2, Users } from "lucide-react";
import type { Farm } from "@/lib/types/common";
import Link from "next/link";
import { BUTTONS, LABELS } from "@/lib/constants/farms";

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
    <div className="flex flex-col gap-3">
      {/* 첫 번째 줄: 주요 액션 */}
      <div className="flex gap-2">
        {/* QR 코드 버튼 - 더 세련된 디자인 */}
        <FarmQRCodeSheet farmId={farm.id} farmName={farm.farm_name} />

        {/* 구성원 버튼 - 더 세련된 디자인 */}
        <Button
          variant="outline"
          className="flex-1 min-w-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group"
          asChild
        >
          <Link
            href={`/admin/farms/${farm.id}/members`}
            className="flex items-center justify-center gap-2"
          >
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
            <span className="font-medium text-blue-700 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-200">
              {BUTTONS.MEMBERS_BUTTON}
            </span>
          </Link>
        </Button>
      </div>

      {/* 두 번째 줄: 관리 액션 (소유자만) */}
      {isOwner && (
        <div className="flex gap-2">
          {/* 수정 버튼 - 더 세련된 디자인 */}
          <Button
            variant="outline"
            onClick={() => onEdit(farm)}
            className="flex-1 min-w-0 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-200 dark:border-amber-700 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-800/40 dark:hover:to-orange-800/40 hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-200 group"
            title={LABELS.EDIT_FARM_TOOLTIP}
          >
            <Edit className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors" />
            <span className="font-medium text-amber-700 dark:text-amber-300 group-hover:text-amber-800 dark:group-hover:text-amber-200">
              {BUTTONS.EDIT_BUTTON}
            </span>
          </Button>

          {/* 삭제 버튼 - 더 세련된 디자인 */}
          <Button
            variant="outline"
            onClick={() => onDelete(farm.id)}
            className="flex-1 min-w-0 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-200 dark:border-red-700 hover:from-red-100 hover:to-pink-100 dark:hover:from-red-800/40 dark:hover:to-pink-800/40 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200 group"
            title={LABELS.DELETE_FARM_TOOLTIP}
          >
            <Trash2 className="h-4 w-4 mr-2 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors" />
            <span className="font-medium text-red-700 dark:text-red-300 group-hover:text-red-800 dark:group-hover:text-red-200">
              {BUTTONS.DELETE_BUTTON}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
