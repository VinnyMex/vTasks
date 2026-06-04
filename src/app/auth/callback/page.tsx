"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      // Extrai tokens do hash manualmente (implicit flow)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const access_token    = params.get("access_token");
      const refresh_token   = params.get("refresh_token");

      if (access_token && refresh_token) {
        // Usa setSession para registrar a sessão sem chamar /auth/v1/user
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          console.error("[callback] setSession error:", error.message);
          router.replace("/login?error=auth&reason=session");
          return;
        }
        // Limpa o hash da URL
        window.history.replaceState(null, "", window.location.pathname);
        router.replace("/");
        return;
      }

      // Sem tokens no hash — verifica se já há sessão persistida
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/");
      } else {
        router.replace("/login?error=auth&reason=no-token");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "var(--bg)" }}
    >
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#2563eb" }} />
      <p className="text-sm font-semibold" style={{ color: "var(--text-faint)" }}>
        Autenticando...
      </p>
    </div>
  );
}
