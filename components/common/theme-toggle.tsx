"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { BUTTONS, LABELS } from "@/lib/constants/common";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleToggle = () => {
    // resolvedTheme을 사용하여 현재 실제 적용된 테마를 확인
    const currentTheme = resolvedTheme || theme || "light";
    setTheme(currentTheme === "light" ? "dark" : "light");
  };

  return (
    <Button variant="outline" size="icon" onClick={handleToggle}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">{BUTTONS.THEME_TOGGLE_SCREEN_READER}</span>
    </Button>
  );
}
