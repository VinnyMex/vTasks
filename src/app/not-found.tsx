export default function NotFound() {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", color: "#71717a" }}>
          <p style={{ fontSize: 72, fontWeight: 900, margin: 0, color: "#18181b" }}>404</p>
          <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Página não encontrada</p>
          <a href="/" style={{ display: "inline-block", marginTop: 24, padding: "10px 24px", background: "#2563eb", color: "#fff", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
            Voltar ao início
          </a>
        </div>
      </body>
    </html>
  );
}
