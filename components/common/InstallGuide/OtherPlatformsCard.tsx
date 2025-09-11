import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { platformGuides } from "./data";
import { LABELS } from "@/lib/constants/common";

export function OtherPlatformsCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">
          {LABELS.INSTALL_GUIDE_OTHER_PLATFORMS_TITLE}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ios" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ios">
              {LABELS.INSTALL_GUIDE_TAB_IOS}
            </TabsTrigger>
            <TabsTrigger value="android">
              {LABELS.INSTALL_GUIDE_TAB_ANDROID}
            </TabsTrigger>
            <TabsTrigger value="samsung">
              {LABELS.INSTALL_GUIDE_TAB_SAMSUNG}
            </TabsTrigger>
            <TabsTrigger value="desktop">
              {LABELS.INSTALL_GUIDE_TAB_DESKTOP}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ios">
            {(platformGuides[0].steps || []).map((step) => (
              <div
                key={step.step}
                className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg"
              >
                <div className="bg-blue-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {step.step}
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs sm:text-sm font-medium">
                    {step.title}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="android">
            {(platformGuides[1].steps || []).map((step) => (
              <div
                key={step.step}
                className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg"
              >
                <div className="bg-blue-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {step.step}
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs sm:text-sm font-medium">
                    {step.title}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="samsung">
            {(platformGuides[2].steps || []).map((step) => (
              <div
                key={step.step}
                className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg"
              >
                <div className="bg-blue-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {step.step}
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs sm:text-sm font-medium">
                    {step.title}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="desktop">
            {(platformGuides[3].steps || []).map((step) => (
              <div
                key={step.step}
                className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg"
              >
                <div className="bg-blue-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {step.step}
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs sm:text-sm font-medium">
                    {step.title}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
