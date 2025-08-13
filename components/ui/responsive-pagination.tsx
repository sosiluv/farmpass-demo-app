"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  usePagination,
  type PaginationResult,
} from "@/hooks/ui/use-pagination";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { useIsMobile, useIsTablet } from "@/hooks/ui/use-mobile";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { BUTTONS } from "@/lib/constants/common";
import { Loader2 } from "lucide-react";

interface ResponsivePaginationProps<T> {
  data: T[];
  itemsPerPage?: number;
  filterFn?: (item: T) => boolean;
  sortFn?: (a: T, b: T) => number;
  children: (
    paginationResult: PaginationResult<T> & {
      isLoadingMore?: boolean;
      hasMore?: boolean;
    }
  ) => React.ReactNode;
  showFirstLast?: boolean;
  showPageInfo?: boolean;
}

// 모바일용 무한 스크롤 컴포넌트
function MobileInfiniteScroll<T>({
  data,
  itemsPerPage,
  filterFn,
  sortFn,
  children,
}: ResponsivePaginationProps<T>) {
  const [displayedItems, setDisplayedItems] = useState(itemsPerPage || 6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const paginationResult = usePagination({
    data,
    itemsPerPage: data.length, // 전체 데이터 사용
    filterFn,
    sortFn,
  });

  const currentDisplayedData = paginationResult.filteredData.slice(
    0,
    displayedItems
  );
  const hasMore = displayedItems < paginationResult.filteredData.length;

  const loadMore = async () => {
    setIsLoadingMore(true);
    // 로딩 애니메이션을 위한 지연
    await new Promise((resolve) => setTimeout(resolve, 300));
    setDisplayedItems((prev) =>
      Math.min(prev + (itemsPerPage || 6), paginationResult.filteredData.length)
    );
    setIsLoadingMore(false);
  };

  // 필터가 변경되거나 데이터가 변경되면 표시 항목 수 리셋
  useEffect(() => {
    setDisplayedItems(itemsPerPage || 6);
  }, [paginationResult.filteredData.length, itemsPerPage]);

  const enhancedResult = {
    ...paginationResult,
    paginatedData: currentDisplayedData,
    isLoadingMore,
    hasMore,
  };

  return (
    <div className="space-y-4">
      {children(enhancedResult)}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={loadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="w-full max-w-xs h-10 text-sm font-medium hover:bg-primary/5 transition-colors"
          >
            {isLoadingMore ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>{BUTTONS.PAGINATION_LOADING}</span>
              </div>
            ) : (
              <>
                {BUTTONS.PAGINATION_LOAD_MORE.replace(
                  "{remaining}",
                  (
                    paginationResult.filteredData.length - displayedItems
                  ).toString()
                )}
              </>
            )}
          </Button>
        </div>
      )}

      {/* 전체 항목 수 표시 */}
      <div className="text-center text-xs text-muted-foreground">
        {BUTTONS.PAGINATION_DISPLAY_COUNT.replace(
          "{current}",
          currentDisplayedData.length.toString()
        ).replace("{total}", paginationResult.filteredData.length.toString())}
      </div>
    </div>
  );
}

// 태블릿용 축약된 페이지네이션 컴포넌트
function TabletCompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  startIndex,
  endIndex,
  totalItems,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}) {
  // 태블릿용 축약된 페이지 번호 생성 (최대 3개만 표시)
  const getCompactPageNumbers = () => {
    const maxVisible = 3;
    const pageNumbers: (number | "ellipsis")[] = [];

    if (totalPages <= maxVisible + 2) {
      // 페이지가 적으면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 첫 페이지
      pageNumbers.push(1);

      if (currentPage > 3) {
        pageNumbers.push("ellipsis");
      }

      // 현재 페이지 주변
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pageNumbers.includes(i)) {
          pageNumbers.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pageNumbers.push("ellipsis");
      }

      // 마지막 페이지
      if (!pageNumbers.includes(totalPages)) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  const pageNumbers = getCompactPageNumbers();

  return (
    <div className="flex items-center gap-6">
      <div className="text-sm text-muted-foreground">
        {BUTTONS.PAGINATION_PAGE_RANGE.replace("{start}", startIndex.toString())
          .replace("{end}", endIndex.toString())
          .replace("{total}", totalItems.toString())}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((pageNumber, index) =>
          pageNumber === "ellipsis" ? (
            <div key={`ellipsis-${index}`} className="px-2">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <Button
              key={pageNumber}
              variant={pageNumber === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className="h-8 w-8 p-0 text-sm"
            >
              {pageNumber}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ResponsivePagination<T>({
  data,
  itemsPerPage = 20,
  filterFn,
  sortFn,
  children,
  showFirstLast = true,
  showPageInfo = true,
}: ResponsivePaginationProps<T>) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드에서만 디바이스 감지 활성화
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 디바이스별 아이템 수 조정 (메모이제이션)
  const adjustedItemsPerPage = useMemo(() => {
    // 서버 사이드나 초기 렌더링에서는 데스크톱 기준으로 처리
    if (!isClient) return itemsPerPage;

    if (isMobile) return Math.max(6, Math.floor(itemsPerPage * 0.3)); // 모바일: 30% (더 적게)
    if (isTablet) return Math.max(12, Math.floor(itemsPerPage * 0.6)); // 태블릿: 60%
    return itemsPerPage; // 데스크톱: 100%
  }, [isClient, isMobile, isTablet, itemsPerPage]);

  // 모든 Hook을 항상 호출 - Hook 규칙 준수
  const paginationResult = usePagination({
    data,
    itemsPerPage: isClient && isMobile ? data.length : adjustedItemsPerPage, // 모바일은 전체 데이터 사용
    filterFn,
    sortFn,
  });

  // 서버 사이드 렌더링이나 초기 로딩 중에는 기본 페이징 표시
  if (!isClient) {
    return (
      <div className="space-y-4">
        {children(paginationResult)}

        {paginationResult.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={paginationResult.currentPage}
              totalPages={paginationResult.totalPages}
              onPageChange={paginationResult.setPage}
              showFirstLast={showFirstLast}
              showPageInfo={showPageInfo}
              startIndex={paginationResult.startIndex}
              endIndex={paginationResult.endIndex}
              totalItems={paginationResult.totalItems}
            />
          </div>
        )}
      </div>
    );
  }

  // 클라이언트 사이드에서 디바이스별 렌더링
  return (
    <>
      {isMobile ? (
        <MobileInfiniteScroll
          data={data}
          itemsPerPage={adjustedItemsPerPage}
          filterFn={filterFn}
          sortFn={sortFn}
          children={children}
        />
      ) : (
        <div className="space-y-4">
          {/* 데이터 렌더링 */}
          {children(paginationResult)}

          {/* 페이징 UI (데이터가 있고 여러 페이지가 있을 때만 표시) */}
          {paginationResult.totalPages > 1 && (
            <div className="flex justify-center">
              {isTablet ? (
                <TabletCompactPagination
                  currentPage={paginationResult.currentPage}
                  totalPages={paginationResult.totalPages}
                  onPageChange={paginationResult.setPage}
                  startIndex={paginationResult.startIndex}
                  endIndex={paginationResult.endIndex}
                  totalItems={paginationResult.totalItems}
                />
              ) : (
                <Pagination
                  currentPage={paginationResult.currentPage}
                  totalPages={paginationResult.totalPages}
                  onPageChange={paginationResult.setPage}
                  showFirstLast={showFirstLast}
                  showPageInfo={showPageInfo}
                  startIndex={paginationResult.startIndex}
                  endIndex={paginationResult.endIndex}
                  totalItems={paginationResult.totalItems}
                />
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// 디바이스별 권장 페이지 크기를 반환하는 헬퍼 함수
export function getRecommendedPageSize(baseSize: number = 20) {
  // 서버 사이드에서는 기본값 반환
  if (typeof window === "undefined") return baseSize;

  const width = window.innerWidth;

  if (width < 768) return Math.max(6, Math.floor(baseSize * 0.3)); // 모바일: 30%
  if (width < 1024) return Math.max(12, Math.floor(baseSize * 0.6)); // 태블릿: 60%
  return baseSize; // 데스크톱
}
