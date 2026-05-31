"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 glass border-b border-zinc-200 dark:border-zinc-900 px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Somente visível em mobile, o logo vai na header se a sidebar estiver escondida */}
        <div className="md:hidden flex items-center gap-2">
          <Image src={theme === 'dark' ? "/logo-white.png" : "/logo-dark.png"} alt="vTasks Logo" width={32} height={32} />
          <span className="font-black text-lg">vTasks</span>
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">vWeb Pro System</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors"
          title="Alternar Tema"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <button className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
          <Plus className="w-4 h-4" />
          <span>Criar</span>
        </button>
      </div>
    </header>
  );
}
