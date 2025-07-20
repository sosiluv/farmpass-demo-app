import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NOT_FOUND_LABELS } from "@/lib/constants/error";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-lg mx-auto">
        {/* 404 숫자 - 더 세련된 스타일 */}
        <div className="relative mb-8">
          <div className="text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-300 leading-none select-none">
            {NOT_FOUND_LABELS.ERROR_CODE}
          </div>
          <div className="absolute inset-0 text-[12rem] font-black text-slate-100 leading-none -z-10 blur-sm">
            {NOT_FOUND_LABELS.ERROR_CODE}
          </div>
        </div>

        {/* 메인 메시지 - 더 모던한 타이포그래피 */}
        <h1 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">
          {NOT_FOUND_LABELS.PAGE_TITLE}
        </h1>

        {/* 설명 - 더 세련된 텍스트 */}
        <p className="text-lg text-slate-500 mb-10 leading-relaxed">
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
            className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
