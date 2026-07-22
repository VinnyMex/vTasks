"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/confirm"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user }  = useAuth();

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  // Páginas públicas (login, callback) — sem chrome do app
  if (isPublic || !user) {
    return (
      <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
        {children}
      </div>
    );
  }

  // App autenticado — layout completo com sidebar + header + navegação responsiva mobile
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
