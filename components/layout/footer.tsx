"use client";

import { Logo } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { FOOTER } from "@/lib/constants/common";

export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-md py-10">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
        {/* 왼쪽: 로고 */}
        <div className="flex items-center gap-2">
          <Logo size="lg" />
        </div>
        {/* 가운데: 뱃지 */}
        <div className="flex gap-2 mt-2 lg:mt-0 lg:items-center">
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span className="inline-block w-2.5 h-2.5 bg-green-400 rounded-full" />
            {FOOTER.BADGES.MOBILE_OPTIMIZED}
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span className="inline-block w-2.5 h-2.5 bg-blue-400 rounded-full" />
            {FOOTER.BADGES.QR_CODE_SUPPORT}
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span className="inline-block w-2.5 h-2.5 bg-yellow-400 rounded-full" />
            {FOOTER.BADGES.REAL_TIME_NOTIFICATION}
          </Badge>
        </div>
        {/* 오른쪽: 회사명/링크 */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-2 mt-2 lg:mt-0 lg:items-center whitespace-nowrap">
          <a
            href={FOOTER.URLS.COMPANY_INTRO}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            {FOOTER.LINKS.COMPANY_INTRO}
          </a>
          <span className="text-gray-300">|</span>
          <a
            href={FOOTER.URLS.LOCATION}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            {FOOTER.LINKS.LOCATION}
          </a>
          <span className="text-gray-300">|</span>
          <a
            href={FOOTER.URLS.TERMS}
            className="underline hover:text-primary transition-colors"
          >
            {FOOTER.LINKS.TERMS_OF_SERVICE}
          </a>
          <span className="text-gray-300">|</span>
          <a
            href={FOOTER.URLS.PRIVACY}
            className="underline hover:text-primary transition-colors"
          >
            {FOOTER.LINKS.PRIVACY_POLICY}
          </a>
        </div>
        {/* 사업자 정보 */}
        <div className="mt-4 text-[11px] text-muted-foreground text-center lg:text-right leading-relaxed lg:mt-0">
          <div className="mt-1">
            {FOOTER.COMPANY_INFO.PHONE} &nbsp;&nbsp; {FOOTER.COMPANY_INFO.FAX}
            <br />
            {FOOTER.COMPANY_INFO.ADDRESS}
          </div>
          <div className="mt-2 font-semibold">
            {FOOTER.COMPANY_INFO.COPYRIGHT.replace(
              "{year}",
              new Date().getFullYear().toString()
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
