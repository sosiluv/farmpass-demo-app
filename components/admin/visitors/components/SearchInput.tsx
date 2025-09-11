import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { PLACEHOLDERS } from "@/lib/constants/visitor";

interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  searchTerm,
  onSearchChange,
  placeholder = PLACEHOLDERS.SEARCH_INPUT_PLACEHOLDER,
}: SearchInputProps) {
  return (
    <div className="relative flex-1 group">
      <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4 group-focus-within:text-blue-500 transition-colors duration-200" />
      <Input
        id="visitor-search"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-9 sm:h-10 md:h-11 lg:h-12 pl-8 sm:pl-10"
      />
      {searchTerm && (
        <button
          onClick={() => onSearchChange("")}
          className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 p-0 rounded-full flex items-center justify-center"
        >
          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
        </button>
      )}
    </div>
  );
}
