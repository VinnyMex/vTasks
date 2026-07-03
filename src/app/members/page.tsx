"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  Users, Plus, Trash2, Share2, X, Check, Loader2,
  ShieldCheck, Eye, PenLine, AlertCircle,
} from "lucide-react";

type Role = "viewer" | "editor" | "admin";
type Member = { id: string; member_id: string; email: string; role: Role; created_at: string };

const ROLE_INFO: Record<Role, { label: string; desc: string; color: string; icon: React.ElementType }> = {
  viewer: { label: "Visual", desc: "Pode apenas visualizar",       color: "var(--role-viewer)", icon: Eye },
  editor: { label: "Editor", desc: "Pode criar e editar",          color: "var(--role-editor)", icon: PenLine },
  admin:  { label: "Admin",  desc: "Pode criar, editar e excluir", color: "var(--role-admin)",  icon: ShieldCheck },
};

export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers]       = useState<Member[]>([]);
  const [loading, setLoading]       = useState(true);

  // Modal adicionar
  const [showAdd, setShowAdd]       = useState(false);
  const [email, setEmail]           = useState("");
  const [role, setRole]             = useState<Role>("viewer");
  const [adding, setAdding]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("members").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
    setMembers((data as Member[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function addMember() {
    if (!user || !email.trim()) return;
    setAdding(true); setError(null);
    const { data: found, error: err } = await supabase.rpc("get_user_id_by_email", { p_email: email.trim().toLowerCase() });
    if (err || !found) { setError("Usuário não encontrado. O email precisa estar cadastrado no vTasks."); setAdding(false); return; }
    const memberId = found as string;
    if (memberId === user.id) { setError("Você não pode adicionar a si mesmo."); setAdding(false); return; }
    const { error: insErr } = await supabase.from("members").insert([{ owner_id: user.id, member_id: memberId, email: email.trim().toLowerCase(), role }]);
    if (insErr) { setError(insErr.code === "23505" ? "Membro já adicionado." : insErr.message); setAdding(false); return; }
    setEmail(""); setRole("viewer"); setShowAdd(false); load(); setAdding(false);
  }

  async function removeMember(m: Member) {
    await supabase.from("shares").delete().eq("owner_id", user!.id).eq("member_id", m.member_id);
    await supabase.from("members").delete().eq("id", m.id);
    setMembers(prev => prev.filter(x => x.id !== m.id));
  }

  async function updateRole(m: Member, newRole: Role) {
    await supabase.from("members").update({ role: newRole }).eq("id", m.id);
    setMembers(prev => prev.map(x => x.id === m.id ? { ...x, role: newRole } : x));
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-purple)" }}>
            <Users className="w-5 h-5" style={{ color: "var(--color-purple)" }} />
          </div>
          <div>
            <h1 className="text-lg font-black" style={{ color: "var(--text)" }}>Membros</h1>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>Gerencie quem tem acesso ao seu workspace</p>
          </div>
        </div>
        <button
          onClick={() => { setShowAdd(true); setError(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold btn-primary"
        >
          <Plus className="w-4 h-4" /> Adicionar membro
        </button>
      </div>

      {/* Lista de membros */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} /></div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Users className="w-10 h-10" style={{ color: "var(--text-faint)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-faint)" }}>Nenhum membro ainda</p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Adicione membros para compartilhar itens específicos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(m => {
            const RoleIcon = ROLE_INFO[m.role].icon;
            return (
              <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
                  {m.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{m.email}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <RoleIcon className="w-3 h-3" style={{ color: ROLE_INFO[m.role].color }} />
                    <span className="text-xs font-semibold" style={{ color: ROLE_INFO[m.role].color }}>{ROLE_INFO[m.role].label}</span>
                    <span className="text-xs" style={{ color: "var(--text-faint)" }}>· {ROLE_INFO[m.role].desc}</span>
                  </div>
                </div>
                <select value={m.role} onChange={e => updateRole(m, e.target.value as Role)}
                  className="text-xs font-semibold px-2 py-1.5 rounded-lg border-0 outline-none"
                  style={{ background: "var(--surface-2)", color: "var(--text)", cursor: "pointer" }}>
                  <option value="viewer">Visual</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => removeMember(m)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-all" style={{ color: "var(--text-faint)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-danger)"; e.currentTarget.style.color = "var(--color-danger)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--text-faint)"; }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal adicionar membro ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 modal-overlay" onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black" style={{ color: "var(--text)" }}>Adicionar membro</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4" style={{ color: "var(--text-faint)" }} /></button>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--text-faint)" }}>EMAIL DO MEMBRO</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                onKeyDown={e => e.key === "Enter" && addMember()} />
              <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>O usuário precisa ter feito login no vTasks ao menos uma vez.</p>
            </div>
            <div className="mb-5">
              <label className="text-xs font-bold mb-2 block" style={{ color: "var(--text-faint)" }}>TIPO DE MEMBRO</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(ROLE_INFO) as [Role, typeof ROLE_INFO[Role]][]).map(([key, info]) => {
                  const Icon = info.icon;
                  return (
                    <button key={key} onClick={() => setRole(key)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-bold transition-all border-2"
                      style={{ borderColor: role === key ? info.color : "var(--border)", background: role === key ? `${info.color}14` : "var(--surface-2)", color: role === key ? info.color : "var(--text-muted)" }}>
                      <Icon className="w-4 h-4" />
                      {info.label}
                      <span className="text-[9px] font-normal text-center leading-tight" style={{ color: "var(--text-faint)" }}>{info.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--text-faint)" }}>
              Após adicionar, use o botão <strong>Acessos</strong> para escolher quais itens compartilhar.
            </p>
            {error && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: "var(--bg-danger)", color: "var(--color-danger)", border: "1px solid var(--color-danger)" }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={addMember} disabled={adding || !email.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 btn-primary">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
