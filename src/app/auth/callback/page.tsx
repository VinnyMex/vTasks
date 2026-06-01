"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

/**
 * Página de callback do OAuth (fluxo implicit).
 * O Supabase redireciona para cá com #access_token=... no hash.
 * O SDK detecta automaticamente via detectSessionInUrl: true.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // O SDK processa o hash automaticamente ao inicializar.
    // Só precisamos aguardar a sessão ser estabelecida.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log("[auth/callback] sessão detectada:", session.user.email);
        router.replace("/");
      } else {
        // Aguarda o onAuthStateChange processar o hash
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("[auth/callback] auth event:", event, "| user:", session?.user?.email);
          if (event === "SIGNED_IN" && session) {
            subscription.unsubscribe();
            router.replace("/");
          } else if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
            subscription.unsubscribe();
            router.replace("/login?error=auth");
          }
        });

        // Timeout de segurança: se em 5s não autenticou, volta pro login
        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          console.error("[auth/callback] timeout — sem sessão após 5s");
          router.replace("/login?error=auth&reason=timeout");
        }, 5000);

        return () => {
          clearTimeout(timeout);
          subscription.unsubscribe();
        };
      }
    });
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
