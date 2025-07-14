import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  searchTerm,
  onSearchChange,
  placeholder = "방문자 이름, 연락처, 차량번호로 검색...",
}: SearchInputProps) {
  return (
    <div className="relative flex-1 group min-w-0">
      <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4 group-focus-within:text-blue-500 transition-colors duration-200" />
      <Input
        id="visitor-search"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8 sm:h-10 md:h-11 lg:h-12 border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white/90 backdrop-blur-sm text-xs sm:text-sm md:text-base min-w-[200px] sm:min-w-[300px] md:min-w-[400px] lg:min-w-[500px] xl:min-w-[600px]"
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSearchChange("")}
          className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 p-0 hover:bg-gray-100 rounded-full transition-all duration-200"
        >
          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
        </Button>
      )}
    </div>
  );
}
