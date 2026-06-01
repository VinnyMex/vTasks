"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/components/AuthProvider";

export type Role = "owner" | "admin" | "editor" | "viewer";

/**
 * Retorna um mapa ownerUserId → role do usuário logado.
 * Para itens que o usuário é o dono, use "owner" diretamente no componente.
 */
export function useRoleMap(): Record<string, Role> {
  const { user } = useAuth();
  const [map, setMap] = useState<Record<string, Role>>({});

  useEffect(() => {
    if (!user) { setMap({}); return; }
    supabase
      .from("members")
      .select("owner_id, role")
      .eq("member_id", user.id)
      .then(({ data }) => {
        const m: Record<string, Role> = {};
        for (const row of data ?? []) {
          m[row.owner_id] = row.role as Role;
        }
        setMap(m);
      });
  }, [user]);

  return map;
}

/**
 * Resolve o role efetivo do usuário para um item com dado owner.
 * - Se ownerUserId === user.id → "owner"
 * - Se está no mapa → o role como membro
 * - Caso contrário → null (sem acesso)
 */
export function resolveRole(
  userId: string | null | undefined,
  ownerUserId: string | null | undefined,
  roleMap: Record<string, Role>
): Role | null {
  if (!userId || !ownerUserId) return null;
  if (userId === ownerUserId) return "owner";
  return roleMap[ownerUserId] ?? null;
}

export function canEdit(role: Role | null): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}

export function canDelete(role: Role | null): boolean {
  return role === "owner" || role === "admin";
}
