"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  HelpCircle,
  Zap,
  ExternalLink,
  Smartphone,
} from "lucide-react";

export function DocumentationSection() {
  const documentationLinks = [
    {
      title: "사용자 매뉴얼",
      description: "시스템의 모든 기능에 대한 상세한 설명서",
      icon: BookOpen,
      href: "/docs/user-manual.html",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "빠른 시작 가이드",
      description: "5분만에 시작하는 농장 출입 관리 시스템",
      icon: Zap,
      href: "/docs/quick-start.html",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "제품 소개서",
      description: "시스템의 주요 기능과 비즈니스 효과",
      icon: FileText,
      href: "/docs/product-overview.html",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "자주 묻는 질문",
      description: "고객들이 가장 궁금해하는 질문과 답변",
      icon: HelpCircle,
      href: "/docs/faq.html",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "PWA 사용 가이드",
      description: "모바일 앱처럼 사용하는 방법과 설치 가이드",
      icon: Smartphone,
      href: "/docs/pwa-guide.html",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  const handleDocumentClick = (href: string) => {
    // 새 탭에서 문서 열기
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            사용자 문서
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            시스템 사용에 도움이 되는 각종 문서들입니다. 관리자만 접근할 수
            있습니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(documentationLinks || []).map((doc) => (
              <motion.div
                key={doc.title}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group"
              >
                <Card className="cursor-pointer border-2 border-transparent hover:border-gray-200 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${doc.bgColor}`}>
                        <doc.icon className={`h-5 w-5 ${doc.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1 group-hover:text-blue-600 transition-colors">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {doc.description}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => handleDocumentClick(doc.href)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          문서 열기
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">💡 사용 팁</p>
                <ul className="space-y-0.5 text-xs">
                  <li>
                    • 처음 사용하시는 경우 <strong>빠른 시작 가이드</strong>부터
                    읽어보세요
                  </li>
                  <li>
                    • 상세한 기능 설명은 <strong>사용자 매뉴얼</strong>을
                    참고하세요
                  </li>
                  <li>
                    • 문제가 생기면 <strong>자주 묻는 질문</strong>을 먼저
                    확인해보세요
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
