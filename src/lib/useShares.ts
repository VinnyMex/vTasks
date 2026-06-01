"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export type ShareOwner = {
  owner_id: string;
  owner_email: string;
  role: string;
};

export type SharedMember = {
  member_id: string;
  member_email: string;
  role: string;
};

export type ResourceType = "task" | "note" | "expense";

/** Retorna quem compartilhou comigo + com quem eu compartilhei para um tipo de recurso */
export function useShares(resource: ResourceType) {
  const [sharedByMe, setSharedByMe]     = useState<SharedMember[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<ShareOwner[]>([]);

  useEffect(() => {
    async function load() {
      const [{ data: byMe }, { data: withMe }] = await Promise.all([
        supabase.rpc("get_my_shared_members", { p_resource: resource }),
        supabase.rpc("get_share_owners",      { p_resource: resource }),
      ]);
      setSharedByMe((byMe as SharedMember[]) ?? []);
      setSharedWithMe((withMe as ShareOwner[]) ?? []);
    }
    load();
  }, [resource]);

  return { sharedByMe, sharedWithMe };
}
