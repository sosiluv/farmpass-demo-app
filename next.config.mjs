import { withSentryConfig } from "@sentry/nextjs";
/**
 * 🚀 Next.js 설정 파일
 *
 * 이 파일은 Next.js 애플리케이션의 빌드, 배포, 성능 최적화를 위한 설정을 포함합니다.
 * PWA(Progressive Web App) 기능과 보안, 성능 최적화가 모두 포함되어 있습니다.
 */

import withPWA from "next-pwa";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseDomain = supabaseUrl
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 빌드 성능 최적화
  productionBrowserSourceMaps: false, // Source maps 비활성화로 빌드 시간 단축
  swcMinify: true, // SWC 압축 활성화 (더 빠른 압축)

  /**
   * 🔬 실험적 기능 설정
   * Next.js의 최신 기능들을 안전하게 테스트할 수 있도록 허용
   */
  experimental: {
    /**
     * 🛡️ Server Actions 보안 설정
     *
     * Server Actions는 클라이언트에서 서버 함수를 직접 호출할 수 있게 해주는 기능입니다.
     * CSRF(Cross-Site Request Forgery) 공격을 방지하기 위해 허용된 도메인만 설정합니다.
     *
     * ⚠️ 커스텀 도메인 구매 시 반드시 추가해야 합니다!
     * 예시: farm-management.kr, myfarm.com 등
     *
     * @see https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
     */
    serverActions: {
      allowedOrigins: [
        "localhost:3000", // 로컬 개발 환경
        "*.vercel.app", // Vercel 배포 환경
        "www.samwon1141.com", // FarmPass 프로덕션 도메인
        "samwon1141.com", // FarmPass 도메인 (www 없이)
      ],
    },
    // 빌드 성능 최적화
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@tanstack/react-query",
      "@tanstack/react-query-devtools",
      "sharp",
      "multer",
    ],
    // React Query 최적화
    optimizeCss: true,
  },

  /**
   * ⚛️ React Strict Mode 활성화
   *
   * 개발 환경에서 잠재적인 문제를 조기에 발견할 수 있도록 도와줍니다.
   * 컴포넌트의 부작용, 레거시 API 사용 등을 감지합니다.
   *
   * @see https://react.dev/reference/react/StrictMode
   */
  reactStrictMode: false,

  /**
   * 🖼️ 이미지 최적화 설정
   *
   * Next.js의 Image 컴포넌트가 외부 도메인의 이미지를 최적화할 수 있도록 허용합니다.
   * 보안상의 이유로 명시적으로 허용할 도메인을 지정해야 합니다.
   */
  images: {
    domains: [
      supabaseDomain, // Supabase Storage 도메인 (환경변수에서 추출)
    ].filter(Boolean), // 빈 값 제거
    unoptimized: false, // 이미지 최적화 활성화 (WebP 변환, 리사이징 등)
    // 이미지 처리 최적화
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  /**
   * 🔍 ESLint 설정
   *
   * 코드 품질을 보장하기 위해 빌드 시 ESLint 검사를 강제합니다.
   * 코드 스타일, 잠재적 버그, 보안 취약점을 자동으로 감지합니다.
   */
  eslint: {
    ignoreDuringBuilds: false, // 빌드 시 ESLint 오류가 있으면 빌드 실패
  },

  /**
   * 📝 TypeScript 설정
   *
   * 타입 안정성을 보장하기 위해 빌드 시 TypeScript 오류 검사를 강제합니다.
   * 런타임 오류를 컴파일 타임에 미리 방지할 수 있습니다.
   */
  typescript: {
    ignoreBuildErrors: false, // TypeScript 오류가 있으면 빌드 실패
  },

  /**
   * 📦 성능 최적화 설정
   */
  compress: true, // gzip 압축 활성화 (전송 크기 60-80% 감소)
  poweredByHeader: false, // X-Powered-By 헤더 제거 (보안 강화)
  generateEtags: true, // ETag 생성으로 브라우저 캐싱 최적화

  /**
   * 📊 번들 분석 도구 설정
   *
   * ANALYZE=true 환경변수로 빌드 시 번들 크기를 분석할 수 있습니다.
   * 사용법: ANALYZE=true npm run build
   *
   * 번들 크기 최적화를 위해 어떤 패키지가 큰 용량을 차지하는지 확인 가능합니다.
   */
  ...(process.env.ANALYZE === "true" && {
    webpack: (config) => {
      config.plugins.push(
        new (require("@next/bundle-analyzer"))({
          enabled: true,
        })
      );
      return config;
    },
  }),

  /**
   * 🚀 React Query + Prisma 최적화
   */
  webpack: (config, { dev, isServer }) => {
    // 프로덕션 빌드에서 DevTools 제외
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@tanstack/react-query-devtools": false,
      };
    }

    // React Query + Prisma 최적화
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          reactQuery: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            name: "react-query",
            chunks: "all",
            priority: 10,
          },
          // 이미지 처리 최적화
          imageProcessing: {
            test: /[\\/]node_modules[\\/](sharp|multer|image-size)[\\/]/,
            name: "image-processing",
            chunks: "all",
            priority: 8,
          },
        },
      },
    };

    return config;
  },
};

/**
 * 📱 PWA (Progressive Web App) 설정
 *
 * 웹 애플리케이션을 네이티브 앱과 유사한 경험으로 제공합니다.
 * - 오프라인 지원
 * - 홈화면 추가
 * - 푸시 알림
 * - 앱과 같은 UI/UX
 */
const config = withPWA({
  /**
   * 📁 PWA 파일 저장 위치
   * public 디렉토리에 service worker와 manifest 파일이 생성됩니다.
   */
  dest: "public",

  /**
   * 🔧 개발 환경에서 PWA 비활성화
   *
   * 개발 중에는 PWA 기능을 비활성화하여 개발 경험을 개선합니다.
   * 프로덕션 빌드에서만 PWA 기능이 활성화됩니다.
   */
  disable: process.env.NODE_ENV === "development",

  /**
   * ✅ 서비스 워커 자동 등록
   *
   * 페이지 로드 시 자동으로 서비스 워커를 등록합니다.
   * 사용자가 별도 작업 없이 PWA 기능을 사용할 수 있습니다.
   */
  register: true,

  /**
   * ⚡ 새 서비스 워커 즉시 활성화
   *
   * 업데이트된 서비스 워커가 있으면 기존 탭을 닫지 않고도 즉시 활성화됩니다.
   * 사용자에게 최신 기능을 빠르게 제공할 수 있습니다.
   */
  skipWaiting: true,

  /**
   * 🔄 캐시 무효화 전략
   *
   * 코드 업데이트 시 즉시 반영되도록 캐시 무효화를 적극적으로 수행합니다.
   */
  reloadOnOnline: true,

  /**
   * 💾 런타임 캐싱 전략
   *
   * 네트워크 요청을 캐시하여 성능을 향상시키고 오프라인 지원을 제공합니다.
   */
  runtimeCaching: [
    /**
     * 🔤 Google Fonts API 캐싱
     *
     * Google Fonts를 1년간 캐시하여 폰트 로딩 속도를 대폭 개선합니다.
     * CacheFirst 전략으로 네트워크보다 캐시를 우선 사용합니다.
     */
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst", // 캐시 우선, 없으면 네트워크
      options: {
        cacheName: "google-fonts-cache",
        expiration: {
          maxEntries: 10, // 최대 10개 폰트 캐시
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1년간 캐시 유지
        },
      },
    },

    /**
     * 🔤 Google Fonts Static 캐싱
     *
     * Google Fonts의 실제 폰트 파일을 캐시합니다.
     * 폰트 파일은 자주 변경되지 않으므로 1년간 캐시해도 안전합니다.
     */
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst", // 캐시 우선, 없으면 네트워크
      options: {
        cacheName: "gstatic-fonts-cache",
        expiration: {
          maxEntries: 10, // 최대 10개 폰트 파일 캐시
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1년간 캐시 유지
        },
      },
    },
  ],

  /**
   * 📱 오프라인 페이지 설정
   *
   * 네트워크 연결이 없을 때 표시할 오프라인 페이지를 지정합니다.
   * 사용자가 오프라인 상태에서도 기본적인 정보를 볼 수 있습니다.
   */
  fallbacks: {
    document: "/offline",
  },

  /**
   * 🔄 네비게이션 폴백
   *
   * SPA에서 라우팅이 실패할 때 오프라인 페이지로 리다이렉트합니다.
   */
  navigateFallback: "/offline",
})(nextConfig);

/**
 * 📤 설정 내보내기
 *
 * Next.js가 이 설정을 사용하여 애플리케이션을 빌드하고 실행합니다.
 */
export default withSentryConfig(config, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "samwon",
  project: "samwon1141-farmpass",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
