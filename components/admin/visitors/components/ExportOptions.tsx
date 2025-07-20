import {
  AlertCircle,
  Building2,
  FileText,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LABELS } from "@/lib/constants/visitor";

interface ExportOptionsProps {
  includeBasic: boolean;
  includeContact: boolean;
  includeVisit: boolean;
  includeExtra: boolean;
  onBasicChange: (checked: boolean) => void;
  onContactChange: (checked: boolean) => void;
  onVisitChange: (checked: boolean) => void;
  onExtraChange: (checked: boolean) => void;
}

export function ExportOptions({
  includeBasic,
  includeContact,
  includeVisit,
  includeExtra,
  onBasicChange,
  onContactChange,
  onVisitChange,
  onExtraChange,
}: ExportOptionsProps) {
  const selectedOptionsCount = [
    includeBasic,
    includeContact,
    includeVisit,
    includeExtra,
  ].filter(Boolean).length;

  return (
    <Card className="border border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center justify-between text-purple-700 text-sm sm:text-base">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>{LABELS.EXPORT_OPTIONS_TITLE}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {LABELS.EXPORT_OPTIONS_SELECTED_COUNT.replace(
              "{count}",
              selectedOptionsCount.toString()
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-basic"
              checked={includeBasic}
              onCheckedChange={(checked) => onBasicChange(checked === true)}
            />
            <Label
              htmlFor="include-basic"
              className="text-xs sm:text-sm cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <Users className="h-3 w-3 text-blue-600" />
                <span>{LABELS.EXPORT_OPTIONS_BASIC_INFO}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {LABELS.EXPORT_OPTIONS_BASIC_DESC}
              </p>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-contact"
              checked={includeContact}
              onCheckedChange={(checked) => onContactChange(checked === true)}
            />
            <Label
              htmlFor="include-contact"
              className="text-xs sm:text-sm cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <FileText className="h-3 w-3 text-green-600" />
                <span>{LABELS.EXPORT_OPTIONS_CONTACT_INFO}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {LABELS.EXPORT_OPTIONS_CONTACT_DESC}
              </p>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-visit"
              checked={includeVisit}
              onCheckedChange={(checked) => onVisitChange(checked === true)}
            />
            <Label
              htmlFor="include-visit"
              className="text-xs sm:text-sm cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <Building2 className="h-3 w-3 text-orange-600" />
                <span>{LABELS.EXPORT_OPTIONS_VISIT_INFO}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {LABELS.EXPORT_OPTIONS_VISIT_DESC}
              </p>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-extra"
              checked={includeExtra}
              onCheckedChange={(checked) => onExtraChange(checked === true)}
            />
            <Label
              htmlFor="include-extra"
              className="text-xs sm:text-sm cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <Sparkles className="h-3 w-3 text-purple-600" />
                <span>{LABELS.EXPORT_OPTIONS_EXTRA_INFO}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {LABELS.EXPORT_OPTIONS_EXTRA_DESC}
              </p>
            </Label>
          </div>
        </div>

        {selectedOptionsCount === 0 && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs">
                {LABELS.EXPORT_OPTIONS_MIN_SELECTION}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
