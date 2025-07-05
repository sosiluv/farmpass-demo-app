"use client";

import Link from "next/link";
import { LucideIcon, Home, ChevronRight, Sparkles } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
  gradient?: boolean;
  animate?: boolean;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  breadcrumbs = [],
  actions,
  className,
  gradient = true,
  animate = false,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        animate ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }
      }
      className={cn(
        "relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-gradient-to-br from-background via-background to-muted/30",
        gradient &&
          "bg-gradient-to-br from-primary/[0.03] via-background to-secondary/[0.05]",
        "shadow-lg shadow-black/[0.03] backdrop-blur-sm ring-1 ring-white/10",
        "dark:shadow-black/20 dark:ring-white/5",
        className
      )}
    >
      {/* 고급 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 메인 그라데이션 오브 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute -top-16 sm:-top-32 -right-16 sm:-right-32 h-32 w-32 sm:h-64 sm:w-64 rounded-full bg-gradient-to-br from-primary/12 via-primary/4 to-secondary/8 blur-2xl sm:blur-3xl"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="absolute -bottom-16 sm:-bottom-32 -left-16 sm:-left-32 h-32 w-32 sm:h-64 sm:w-64 rounded-full bg-gradient-to-tr from-accent/8 via-secondary/4 to-primary/8 blur-2xl sm:blur-3xl"
        />

        {/* 미묘한 패턴 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.008] to-transparent" />

        {/* 스파클 효과 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.8 }}
          className="absolute top-3 right-4 sm:top-6 sm:right-8"
        >
          <Sparkles className="h-2 w-2 sm:h-3 sm:w-3 text-primary/15" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.2 }}
          className="absolute bottom-4 left-6 sm:bottom-8 sm:left-12"
        >
          <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-secondary/20" />
        </motion.div>
      </div>

      <div className="relative space-y-2 sm:space-y-3 p-3 sm:p-4 md:p-5 lg:p-6 w-full max-w-full overflow-hidden">
        {/* 브레드크럼 및 액션 */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between"
        >
          <Breadcrumb>
            <BreadcrumbList className="flex-wrap gap-0.5 sm:gap-1">
              {/* 대시보드 홈 링크 */}
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href="/admin/dashboard"
                    className="group flex items-center gap-1 sm:gap-2 rounded-md sm:rounded-lg px-1.5 sm:px-2 py-1 text-xs sm:text-sm text-muted-foreground transition-all duration-300 hover:bg-primary/5 hover:text-primary"
                  >
                    <Home className="h-3 w-3 sm:h-4 sm:w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                    <span className="hidden sm:inline font-medium">
                      대시보드
                    </span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              {/* 추가 브레드크럼 아이템들 */}
              {breadcrumbs.map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-0.5 sm:gap-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.2 + index * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground/40" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link
                          href={item.href}
                          className="group flex items-center gap-1 sm:gap-2 rounded-md sm:rounded-lg px-1.5 sm:px-2 py-1 text-xs sm:text-sm text-muted-foreground transition-all duration-300 hover:bg-primary/5 hover:text-primary"
                        >
                          {item.icon && (
                            <item.icon className="h-3 w-3 sm:h-4 sm:w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                          )}
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="flex items-center gap-1 sm:gap-2 rounded-md sm:rounded-lg px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-semibold text-foreground">
                        {item.icon && (
                          <item.icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        )}
                        <span>{item.label}</span>
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </motion.div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          {/* 브레드크럼 row의 오른쪽 액션 */}
          {actions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 flex-shrink-0"
            >
              {actions}
            </motion.div>
          )}
        </motion.div>

        {/* 페이지 제목 및 액션 */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-4">
          <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <SidebarTrigger className="mt-0.5 transition-all duration-300 hover:scale-105 hover:bg-primary/10" />
            </motion.div>

            <div className="flex-1 space-y-0.5 sm:space-y-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex items-center gap-2 sm:gap-2.5"
              >
                {Icon && (
                  <motion.div
                    initial={
                      animate
                        ? { scale: 0, rotate: -180 }
                        : { scale: 1, rotate: 0 }
                    }
                    animate={{ scale: 1, rotate: 0 }}
                    transition={
                      animate
                        ? {
                            duration: 0.8,
                            delay: 0.4,
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                          }
                        : { duration: 0 }
                    }
                    className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-md sm:rounded-lg bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 ring-1 ring-primary/20 shadow-sm shadow-primary/10 flex-shrink-0"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="space-y-0.5 min-w-0"
                >
                  <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent sm:text-xl md:text-2xl truncate">
                    {title}
                  </h1>
                  {description && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      className="text-[10px] sm:text-xs md:text-sm text-muted-foreground leading-relaxed max-w-2xl font-medium line-clamp-2"
                    >
                      {description}
                    </motion.p>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* 고급 하단 그라데이션 라인 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* 미묘한 상단 하이라이트 */}
      <div className="absolute top-0 left-4 right-4 sm:left-8 sm:right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </motion.div>
  );
}
