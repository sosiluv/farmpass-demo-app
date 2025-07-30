import { useState, useMemo } from "react";

interface PaginationOptions<T> {
  data: T[];
  itemsPerPage: number;
  filterFn?: (item: T) => boolean;
  sortFn?: (a: T, b: T) => number;
}

export interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  filteredData: T[];
  setPage: (page: number) => void;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  canGoToNextPage: boolean;
  canGoToPreviousPage: boolean;
}

export function usePagination<T>({
  data,
  itemsPerPage,
  filterFn = () => true,
  sortFn,
}: PaginationOptions<T>): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let result = data.filter(filterFn);
    if (sortFn) {
      result = [...result].sort(sortFn);
    }
    return result;
  }, [data, filterFn, sortFn]);

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // 현재 페이지의 데이터
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // 페이지 이동 함수들
  const setPage = (page: number) => {
    if (page < 1) {
      setCurrentPage(1);
    } else if (page > totalPages) {
      setCurrentPage(totalPages);
    } else {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => setPage(1);
  const goToLastPage = () => setPage(totalPages);
  const goToNextPage = () => setPage(currentPage + 1);
  const goToPreviousPage = () => setPage(currentPage - 1);

  // 현재 표시되는 아이템의 범위
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredData.length);

  // 페이지 이동 가능 여부
  const canGoToNextPage = currentPage < totalPages;
  const canGoToPreviousPage = currentPage > 1;

  return {
    currentPage,
    totalPages,
    paginatedData,
    filteredData,
    setPage,
    totalItems: filteredData.length,
    startIndex,
    endIndex,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    canGoToNextPage,
    canGoToPreviousPage,
  };
}
