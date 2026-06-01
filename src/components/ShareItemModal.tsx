"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useMembers } from "@/lib/useMembers";
import { X, Check, Loader2, Share2, Eye, PenLine, ShieldCheck } from "lucide-react";

type Props = {
  resourceType: "task" | "note" | "expense";
  resourceId: string;
  resourceLabel: string;
  onClose: () => void;
};

const ROLE_COLOR = { viewer: "#6b7280", editor: "#3b82f6", admin: "#f59e0b" };
const ROLE_ICON  = { viewer: Eye, editor: PenLine, admin: ShieldCheck };
const ROLE_LABEL = { viewer: "Visual", editor: "Editor", admin: "Admin" };

export function ShareItemModal({ resourceType, resourceId, resourceLabel, onClose }: Props) {
  const { user }  = useAuth();
  const members   = useMembers();
  const [shared, setShared]     = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("shares")
      .select("member_id")
      .eq("owner_id", user.id)
      .eq("resource", resourceType)
      .eq("resource_id", resourceId)
      .then(({ data }) => {
        setShared(new Set((data ?? []).map(d => d.member_id)));
        setLoading(false);
      });
  }, [user, resourceType, resourceId]);

  async function save() {
    if (!user) return;
    setSaving(true);

    // Remove todos os shares específicos desse item
    await supabase.from("shares")
      .delete()
      .eq("owner_id", user.id)
      .eq("resource", resourceType)
      .eq("resource_id", resourceId);

    // Reinsere os selecionados
    if (shared.size > 0) {
      await supabase.from("shares").insert(
        [...shared].map(memberId => ({
          owner_id:    user.id,
          member_id:   memberId,
          resource:    resourceType,
          resource_id: resourceId,
        }))
      );
    }

    setSaving(false);
    onClose();
  }

  function toggle(memberId: string) {
    setShared(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <Share2 className="w-4 h-4 flex-shrink-0" style={{ color: "#2563eb" }} />
            <div className="min-w-0">
              <p className="text-sm font-black" style={{ color: "var(--text)" }}>Compartilhar</p>
              <p className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{resourceLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="ml-3 flex-shrink-0">
            <X className="w-4 h-4" style={{ color: "var(--text-faint)" }} />
          </button>
        </div>

        {/* Lista de membros */}
        <div className="p-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "#2563eb" }} /></div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-semibold" style={{ color: "var(--text-faint)" }}>Nenhum membro cadastrado</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Adicione membros em Configurações → Membros</p>
            </div>
          ) : (
            <div className="space-y-1">
              {members.map(m => {
                const RoleIcon = ROLE_ICON[m.role];
                const checked  = shared.has(m.member_id);
                return (
                  <button
                    key={m.member_id}
                    onClick={() => toggle(m.member_id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={{ background: checked ? "rgba(37,99,235,0.08)" : "transparent" }}
                    onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "var(--surface-2)"; }}
                    onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                      style={{ background: checked ? "#2563eb" : "var(--surface-2)", color: checked ? "#fff" : "var(--text)" }}>
                      {m.email[0].toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{m.email}</p>
                      <div className="flex items-center gap-1">
                        <RoleIcon className="w-3 h-3" style={{ color: ROLE_COLOR[m.role] }} />
                        <span className="text-[10px] font-bold" style={{ color: ROLE_COLOR[m.role] }}>{ROLE_LABEL[m.role]}</span>
                      </div>
                    </div>
                    {/* Check */}
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: checked ? "#2563eb" : "var(--surface-2)", border: `1.5px solid ${checked ? "#2563eb" : "var(--border)"}` }}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {members.length > 0 && (
          <div className="flex gap-3 px-4 pb-4">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
              Cancelar
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
              style={{ background: "#2563eb", color: "#fff" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Salvar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
