"use client";

import { Logo } from "@/components/common/logo";
import { FOOTER, SOCIAL_LINKS } from "@/lib/constants/common";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-md py-2">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        {/* 왼쪽: 로고 */}
        <div className="flex items-center">
          <Logo size="lg" />
        </div>

        {/* 가운데: 소셜 링크 */}
        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map((link, index) => (
            <a
              key={index}
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={
                link.href.startsWith("mailto:")
                  ? undefined
                  : "noopener noreferrer"
              }
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              title={link.title}
            >
              <Image src={link.src} alt={link.alt} width={40} height={40} />
            </a>
          ))}
        </div>

        {/* 오른쪽: 회사명/링크 */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-2 mt-3 md:mt-0 md:items-center whitespace-nowrap">
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
        <div className="mt-3 text-[11px] text-muted-foreground text-center md:text-right leading-relaxed md:mt-0">
          <div className="font-semibold">
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
