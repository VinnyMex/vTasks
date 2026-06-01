"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/components/AuthProvider";

/**
 * Resolve emails de UUIDs de usuários a partir da tabela members
 * (onde os emails dos membros já ficam armazenados).
 * Também reconhece o próprio user.id como "Você".
 */
export function useEmailById(ids: (string | null | undefined)[]): Record<string, string> {
  const { user } = useAuth();
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const validIds = [...new Set(ids.filter((id): id is string => !!id))];
    if (!validIds.length || !user) return;

    const unknown = validIds.filter(id => !map[id] && id !== user.id);
    if (unknown.length === 0) return;

    // Busca via tabela members (como membro OU como owner)
    Promise.all([
      supabase.from("members").select("member_id, email").in("member_id", unknown),
      supabase.from("members").select("owner_id, email").in("owner_id", unknown).eq("member_id", user.id),
    ]).then(([{ data: asMember }, { data: asOwner }]) => {
      const next: Record<string, string> = {};
      for (const r of asMember ?? []) if (r.email) next[r.member_id] = r.email;
      // Para owners, tenta pegar via campo email na tabela members (inverso)
      for (const r of asOwner ?? []) if (r.owner_id && !next[r.owner_id]) {
        // Não temos o email do owner diretamente aqui; pula
      }
      if (Object.keys(next).length) setMap(prev => ({ ...prev, ...next }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(ids), user?.id]);

  // Injeta "Você" para o próprio user
  const result: Record<string, string> = { ...map };
  if (user?.id) result[user.id] = "Você";
  return result;
}
