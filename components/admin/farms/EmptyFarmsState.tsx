import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface EmptyFarmsStateProps {
  onAddClick: () => void;
}

export function EmptyFarmsState({ onAddClick }: EmptyFarmsStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">등록된 농장이 없습니다</h3>
              <p className="text-muted-foreground">
                첫 번째 농장을 등록하여 시작하세요
              </p>
            </div>
            <Button onClick={onAddClick}>
              <Plus className="mr-2 h-4 w-4" />첫 농장 등록하기
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
