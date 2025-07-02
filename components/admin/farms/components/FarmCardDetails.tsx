import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MapPin, Phone, Users } from "lucide-react";
import type { Farm } from "@/lib/hooks/use-farms";

interface FarmCardDetailsProps {
  farm: Farm;
}

export function FarmCardDetails({ farm }: FarmCardDetailsProps) {
  return (
    <div className="space-y-3 text-sm flex-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-start space-x-2 cursor-help">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">
                {farm.farm_address}
                {farm.farm_detailed_address && (
                  <>
                    <br />
                    <span className="text-xs">
                      {farm.farm_detailed_address}
                    </span>
                  </>
                )}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div>
              <p>{farm.farm_address}</p>
              {farm.farm_detailed_address && (
                <p className="text-xs mt-1">{farm.farm_detailed_address}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {farm.manager_name && (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">
            관리자: {farm.manager_name}
          </span>
        </div>
      )}
      {farm.manager_phone && (
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">{farm.manager_phone}</span>
        </div>
      )}
      {farm.description && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-accent p-2 rounded text-xs cursor-help">
                <p
                  className="overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {farm.description}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs whitespace-pre-wrap">{farm.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
