"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { signInWithGoogle } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Se já estiver logado, redireciona direto
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/");
    });
  }, [router]);

  // Mostra erro se voltou do callback com ?error=auth
  useEffect(() => {
    if (searchParams.get("error")) {
      const reason = searchParams.get("reason") ?? "";
      setError(`Não foi possível autenticar. ${reason ? `(${reason})` : "Tente novamente."}`);
    }
  }, [searchParams]);

  async function handleGoogle() {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      // O browser será redirecionado para o Google — não precisa fazer nada aqui
    } catch {
      setError("Erro ao iniciar login com Google. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 fade-up"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 relative mb-4">
            <Image
              src="/vtasks-light.png"
              alt="vTasks"
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text)" }}>
            vTasks<span style={{ color: "#2563eb" }}>Pro</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
            vWeb Marketing · Sistema de Produtividade
          </p>
        </div>

        {/* Divisor */}
        <div className="h-px mb-8" style={{ background: "var(--border)" }} />

        <p className="text-xs font-black uppercase tracking-widest text-center mb-5" style={{ color: "var(--text-faint)" }}>
          Entrar na sua conta
        </p>

        {/* Erro */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold text-center"
            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {error}
          </div>
        )}

        {/* Botão Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            boxShadow: "var(--card-shadow)",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#4285f4")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#4285f4" }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <path d="M47.532 24.552c0-1.636-.132-3.196-.378-4.692H24.48v9.168h12.988c-.576 2.988-2.268 5.52-4.8 7.212v5.988h7.764c4.548-4.188 7.1-10.356 7.1-17.676z" fill="#4285F4"/>
              <path d="M24.48 48c6.468 0 11.892-2.148 15.852-5.772l-7.764-5.988c-2.148 1.44-4.896 2.292-8.088 2.292-6.228 0-11.496-4.212-13.38-9.876H3.096v6.18C7.044 42.876 15.204 48 24.48 48z" fill="#34A853"/>
              <path d="M11.1 28.656A14.4 14.4 0 0 1 10.356 24c0-1.62.276-3.192.744-4.656v-6.18H3.096A23.988 23.988 0 0 0 .48 24c0 3.888.924 7.572 2.616 10.836l8.004-6.18z" fill="#FBBC05"/>
              <path d="M24.48 9.468c3.516 0 6.66 1.212 9.132 3.576l6.84-6.84C36.36 2.388 30.948 0 24.48 0 15.204 0 7.044 5.124 3.096 13.164l8.004 6.18c1.884-5.664 7.152-9.876 13.38-9.876z" fill="#EA4335"/>
            </svg>
          )}
          {loading ? "Redirecionando..." : "Continuar com Google"}
        </button>

        <p className="text-[10px] text-center mt-5" style={{ color: "var(--text-faint)" }}>
          Ao entrar, você concorda com o uso interno da plataforma vWeb Marketing.
        </p>
      </div>
    </div>
  );
}
