import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { platformGuides } from "./data";

export function OtherPlatformsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">다른 플랫폼 가이드</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ios" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ios">iOS</TabsTrigger>
            <TabsTrigger value="android">Android</TabsTrigger>
            <TabsTrigger value="samsung">Samsung</TabsTrigger>
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
          </TabsList>

          <TabsContent value="ios">
            <div className="space-y-3">
              {platformGuides[0].steps.map((step) => (
                <div
                  key={step.step}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">{step.title}</h5>
                    <p className="text-xs text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="android">
            <div className="space-y-3">
              {platformGuides[1].steps.map((step) => (
                <div
                  key={step.step}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">{step.title}</h5>
                    <p className="text-xs text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="samsung">
            <div className="space-y-3">
              {platformGuides[2].steps.map((step) => (
                <div
                  key={step.step}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">{step.title}</h5>
                    <p className="text-xs text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="desktop">
            <div className="space-y-3">
              {platformGuides[3].steps.map((step) => (
                <div
                  key={step.step}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">{step.title}</h5>
                    <p className="text-xs text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
