export default function NotFound() {
  return (
    <html lang="pt-BR">
      <body style={{
        margin: 0,
        background: "var(--bg, #f2f2f7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}>
        <div style={{ textAlign: "center", color: "var(--text-muted, #8e8e93)" }}>
          <p style={{ fontSize: 80, fontWeight: 900, margin: 0, color: "var(--text, #1c1c1e)", letterSpacing: "-0.04em" }}>404</p>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 8 }}>Página não encontrada</p>
          <a href="/" style={{
            display: "inline-block",
            marginTop: 28,
            padding: "10px 28px",
            background: "var(--accent, #007aff)",
            color: "#fff",
            borderRadius: 12,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 2px 12px rgba(0,122,255,0.3)",
          }}>
            Voltar ao início
          </a>
        </div>
      </body>
    </html>
  );
}
