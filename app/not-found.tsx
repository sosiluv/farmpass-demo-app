import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NOT_FOUND_LABELS } from "@/lib/constants/error";
import { LottieLoading } from "@/components/ui/lottie-loading";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full mx-auto">
        {/* 404 Lottie 애니메이션 */}
        <div className="mb-8 flex justify-center">
          <div className="w-64 h-64">
            <LottieLoading
              animationPath="/lottie/404.json"
              size="xl"
              showText={false}
              fullScreen={false}
            />
          </div>
        </div>

        {/* 메인 메시지 - 더 모던한 타이포그래피 */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 tracking-tight">
          {NOT_FOUND_LABELS.PAGE_TITLE}
        </h1>

        {/* 설명 - 더 세련된 텍스트 */}
        <p className="text-base sm:text-lg text-slate-500 mb-10 leading-relaxed">
          {NOT_FOUND_LABELS.DESCRIPTION.split("\n").map((line, index) => (
            <span key={index}>
              {line}
              {index < NOT_FOUND_LABELS.DESCRIPTION.split("\n").length - 1 && (
                <br />
              )}
            </span>
          ))}
        </p>

        {/* 세련된 액션 버튼 */}
        <Link href="/admin/dashboard">
          <Button
            size="lg"
            className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
          >
            {NOT_FOUND_LABELS.BUTTONS.GO_HOME}
          </Button>
        </Link>

        {/* 서브틀한 장식 요소 */}
        <div className="mt-16 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
}
