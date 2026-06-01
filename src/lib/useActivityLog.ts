"use client";

import { supabase } from "./supabase";

type Action   = "create" | "update" | "delete";
type Resource = "task" | "note" | "expense";

export async function logActivity(
  userId: string,
  ownerId: string,
  action: Action,
  resource: Resource,
  description: string,
  resourceId?: string,
) {
  await supabase.from("activity_logs").insert([{
    user_id:     userId,
    owner_id:    ownerId,
    action,
    resource,
    resource_id: resourceId ?? null,
    description,
  }]);
}
