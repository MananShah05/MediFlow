"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../theme-provider";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-bg-surface hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-clinical/20"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: -10, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 10, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          className="flex items-center justify-center"
        >
          {theme === "dark" ? (
            <Sun className="w-[18px] h-[18px] text-warning-strong" />
          ) : (
            <Moon className="w-[18px] h-[18px] text-clinical" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
