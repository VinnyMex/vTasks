"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

/**
 * Página intermediária que troca o ?code= pela sessão no cliente.
 * O SDK do browser consegue persistir os cookies de sessão corretamente.
 */
export default function AuthConfirmPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const ran          = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    console.log("[auth/confirm] code present:", !!code, "| next:", next);

    if (!code) {
      console.error("[auth/confirm] sem code na URL");
      setErrorMsg("Parâmetro de autenticação ausente.");
      setTimeout(() => router.replace("/login?error=auth"), 2000);
      return;
    }

    supabase.auth.exchangeCodeForSession(code)
      .then(({ data, error }) => {
        if (error) {
          console.error("[auth/confirm] exchangeCodeForSession error:", error.message, error);
          setErrorMsg(error.message);
          setTimeout(() => router.replace("/login?error=auth"), 3000);
        } else {
          console.log("[auth/confirm] sessão criada:", data.session?.user?.email);
          router.replace(next);
        }
      });
  }, [router, searchParams]);

  if (errorMsg) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-8"
        style={{ background: "var(--bg)" }}
      >
        <p className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>Erro de autenticação</p>
        <p className="text-xs text-center max-w-sm" style={{ color: "var(--text-faint)" }}>
          {errorMsg}
        </p>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          Redirecionando...
        </p>
      </div>
    );
  }

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
