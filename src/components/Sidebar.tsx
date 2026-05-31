"use client";

import {
  CheckSquare,
  LayoutDashboard,
  FileText,
  Calendar as CalendarIcon,
  Settings,
  Zap,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { useTheme } from "./ThemeProvider";

const sidebarItems = [
  { icon: Zap,              label: "Home",       href: "/",         color: "text-amber-500" },
  { icon: CheckSquare,      label: "Tarefas",    href: "/tasks",    color: "text-blue-500" },
  { icon: LayoutDashboard,  label: "Board",      href: "/board",    color: "text-purple-500" },
  { icon: FileText,         label: "Notas",      href: "/notes",    color: "text-amber-500" },
  { icon: CalendarIcon,     label: "Calendário", href: "/calendar", color: "text-green-500" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <>
      {/* Botão mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className={`
        fixed md:sticky top-0 left-0 z-40
        w-64 h-screen bg-white dark:bg-zinc-950
        border-r border-zinc-100 dark:border-zinc-900
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-6 pb-4">
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
            <div className="w-9 h-9 relative flex-shrink-0">
              <Image
                src="/logo-dark.png"
                alt="vTasks Logo"
                fill
                className={`object-contain transition-all ${theme === "dark" ? "brightness-0 invert" : ""}`}
              />
            </div>
            <span className="font-black text-xl tracking-tight text-zinc-900 dark:text-white">
              vTasks<span className="text-blue-600">Pro</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : item.color}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-xs border border-blue-200 dark:border-blue-900">
              VM
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black text-zinc-900 dark:text-zinc-200 truncate">vWeb Marketing</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-600 truncate">Equipe</p>
            </div>
            <Settings className="w-4 h-4 text-zinc-300 dark:text-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-400 cursor-pointer transition-colors flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
        />
      )}
    </>
  );
}
