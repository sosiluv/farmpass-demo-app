"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { BUTTONS, LABELS } from "@/lib/constants/common";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleToggle = () => {
    // resolvedTheme을 사용하여 현재 실제 적용된 테마를 확인
    const currentTheme = resolvedTheme || theme || "light";
    setTheme(currentTheme === "light" ? "dark" : "light");
  };

  return (
    <button
      className="relative p-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:ring-transparent focus:border-transparent"
      style={{ outline: "none" }}
      onClick={handleToggle}
      aria-label={BUTTONS.THEME_TOGGLE_SCREEN_READER}
    >
      <div className="relative h-5 w-5">
        <Sun className="absolute inset-0 h-5 w-5 text-gray-700 dark:text-gray-300 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute inset-0 h-5 w-5 text-gray-700 dark:text-gray-300 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </div>
    </button>
  );
}
