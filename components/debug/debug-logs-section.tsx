import { Button } from "@/components/ui/button";
import { Clock, Trash2 } from "lucide-react";

interface DebugLogsSectionProps {
  logs: string[];
  onClearLogs: () => void;
}

export function DebugLogsSection({ logs, onClearLogs }: DebugLogsSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-700">
          <Clock className="h-3 w-3" />
          <span className="font-medium">실시간 로그</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearLogs}
          className="h-6 px-2 text-orange-600 hover:text-orange-800 hover:bg-orange-100"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="max-h-32 overflow-y-auto bg-orange-100/50 rounded p-2 space-y-1">
        {logs.length === 0 ? (
          <div className="text-orange-500 text-center py-2">
            로그가 없습니다
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-orange-700 font-mono text-xs">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
