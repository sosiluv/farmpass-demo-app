"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

async function fetchOrphanFiles() {
  const res = await fetch("/api/admin/check-orphan-images", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Orphan 파일 조회 실패");
  return res.json();
}

export default function OrphanFilesPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showDebug, setShowDebug] = React.useState(false);

  const refreshData = () => {
    setLoading(true);
    setError(null);
    fetchOrphanFiles()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orphan 파일 현황</CardTitle>
            <Button onClick={refreshData} disabled={loading}>
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <div>로딩 중...</div>}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {data && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">방문자 orphan 파일</span>
                  <Badge
                    variant={
                      data.visitorOrphanCount > 0 ? "destructive" : "default"
                    }
                  >
                    {data.visitorOrphanCount}개
                  </Badge>
                </div>
                {data.visitorOrphanCount > 0 ? (
                  <ul className="list-disc ml-6 text-sm text-red-600">
                    {data.visitorOrphans.map((f: string) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    orphan 파일 없음
                  </div>
                )}
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">프로필 orphan 파일</span>
                  <Badge
                    variant={
                      data.profileOrphanCount > 0 ? "destructive" : "default"
                    }
                  >
                    {data.profileOrphanCount}개
                  </Badge>
                </div>
                {data.profileOrphanCount > 0 ? (
                  <ul className="list-disc ml-6 text-sm text-red-600">
                    {data.profileOrphans.map((f: string) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    orphan 파일 없음
                  </div>
                )}
              </div>

              {/* 디버깅 정보 */}
              {data.debug && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Info className="h-4 w-4 mr-2" />
                      디버깅 정보 보기
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <Card className="bg-gray-50">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">
                              방문자 파일 정보
                            </h4>
                            <div className="text-sm space-y-1">
                              <div>
                                사용 중인 URL: {data.debug.visitor.usedUrlCount}
                                개
                              </div>
                              <div>
                                Storage 파일:{" "}
                                {data.debug.visitor.storageFileCount}개
                              </div>
                              {data.debug.visitor.dbError && (
                                <div className="text-red-600">
                                  DB 오류:{" "}
                                  {JSON.stringify(data.debug.visitor.dbError)}
                                </div>
                              )}
                              {data.debug.visitor.storageError && (
                                <div className="text-red-600">
                                  Storage 오류:{" "}
                                  {JSON.stringify(
                                    data.debug.visitor.storageError
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">
                              프로필 파일 정보
                            </h4>
                            <div className="text-sm space-y-1">
                              <div>
                                사용 중인 URL: {data.debug.profile.usedUrlCount}
                                개
                              </div>
                              <div>
                                Storage 파일:{" "}
                                {data.debug.profile.storageFileCount}개
                              </div>
                              {data.debug.profile.dbError && (
                                <div className="text-red-600">
                                  DB 오류:{" "}
                                  {JSON.stringify(data.debug.profile.dbError)}
                                </div>
                              )}
                              {data.debug.profile.storageError && (
                                <div className="text-red-600">
                                  Storage 오류:{" "}
                                  {JSON.stringify(
                                    data.debug.profile.storageError
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <details className="mt-4">
                          <summary className="cursor-pointer font-semibold">
                            전체 디버깅 데이터
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(data.debug, null, 2)}
                          </pre>
                        </details>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
