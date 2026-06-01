"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/components/AuthProvider";

export type MemberEntry = {
  id: string;
  member_id: string;
  email: string;
  role: "viewer" | "editor" | "admin";
};

export function useMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("members")
      .select("id, member_id, email, role")
      .eq("owner_id", user.id)
      .order("email")
      .then(({ data }) => setMembers((data as MemberEntry[]) ?? []));
  }, [user]);

  return members;
}
