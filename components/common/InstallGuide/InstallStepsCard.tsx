import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { PlatformGuide } from "./data";
import { LABELS } from "@/lib/constants/common";

interface InstallStepsCardProps {
  currentGuide: PlatformGuide;
}

export function InstallStepsCard({ currentGuide }: InstallStepsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">
          {LABELS.INSTALL_GUIDE_STEPS_TITLE}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-4">
          {(currentGuide.steps || []).map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 sm:gap-4"
            >
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                {step.step}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-blue-500">{step.icon}</div>
                  <h4 className="text-sm sm:text-base font-medium">
                    {step.title}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-tight">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
