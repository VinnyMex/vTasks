"use client";

import { Share2, Eye, PenLine, ShieldCheck, Clock, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export type SharedSectionMode = "received" | "sent";

type Props = {
  mode: SharedSectionMode;
  email: string;
  role: string;
  lastUpdatedAt?: string | null;
  lastUpdatedBy?: string | null;
  count: number;
  children: React.ReactNode;
};

const ROLE_ICON: Record<string, React.ElementType> = {
  viewer: Eye,
  editor: PenLine,
  admin:  ShieldCheck,
};
const ROLE_COLOR: Record<string, string> = {
  viewer: "#6b7280",
  editor: "#3b82f6",
  admin:  "#f59e0b",
};
const ROLE_LABEL: Record<string, string> = {
  viewer: "Visual",
  editor: "Editor",
  admin:  "Admin",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function SharedSection({ mode, email, role, lastUpdatedAt, lastUpdatedBy, count, children }: Props) {
  const RoleIcon   = ROLE_ICON[role]  ?? Eye;
  const roleColor  = ROLE_COLOR[role] ?? "#6b7280";
  const roleLabel  = ROLE_LABEL[role] ?? role;
  const DirIcon    = mode === "received" ? ArrowDownToLine : ArrowUpFromLine;
  const dirColor   = mode === "received" ? "#8b5cf6" : "#2563eb";
  const dirLabel   = mode === "received" ? "Compartilhado por" : "Compartilhado com";

  return (
    <div className="mt-6">
      {/* Cabeçalho da seção */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl mb-2"
        style={{
          background: mode === "received" ? "rgba(139,92,246,0.07)" : "rgba(37,99,235,0.07)",
          border: `1px solid ${mode === "received" ? "rgba(139,92,246,0.2)" : "rgba(37,99,235,0.2)"}`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${dirColor}18` }}>
            <DirIcon className="w-3.5 h-3.5" style={{ color: dirColor }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: dirColor }}>
                {dirLabel}
              </span>
              <span className="text-xs font-bold" style={{ color: "var(--text)" }}>{email}</span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: `${roleColor}14` }}>
                <RoleIcon className="w-3 h-3" style={{ color: roleColor }} />
                <span className="text-[10px] font-bold" style={{ color: roleColor }}>{roleLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Share2 className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
              <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                {count} {count === 1 ? "item" : "itens"}
              </span>
            </div>
          </div>
        </div>

        {/* Última atualização */}
        {lastUpdatedAt && (
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
              <span className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>
                Última atualização
              </span>
            </div>
            <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{fmtDate(lastUpdatedAt)}</p>
            {lastUpdatedBy && (
              <p className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>por {lastUpdatedBy}</p>
            )}
          </div>
        )}
      </div>

      {/* Itens */}
      {children}
    </div>
  );
}
