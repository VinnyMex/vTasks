/**
 * Design Tokens centralizados — referencia as CSS variables definidas em globals.css
 * Acento único: #0A84FF — sem cores multicoloridas na sidebar
 */

/** Tokens de status de tarefas */
export const STATUS = {
  done:    { color: "var(--color-done)",    bg: "var(--bg-done)"    },
  doing:   { color: "var(--color-doing)",   bg: "var(--bg-doing)"   },
  pending: { color: "var(--color-pending)", bg: "var(--surface-3)"  },
} as const;

/** Tokens de papel de usuário */
export const ROLE = {
  viewer: { color: "var(--role-viewer)", bg: "rgba(142,142,147,0.10)", label: "Visual"  },
  editor: { color: "var(--role-editor)", bg: "var(--bg-doing)",         label: "Editor"  },
  admin:  { color: "var(--role-admin)",  bg: "var(--bg-warning)",       label: "Admin"   },
} as const;

/** Tokens de moedas */
export const CURRENCY = {
  BRL: { color: "var(--currency-brl)", bg: "var(--bg-done)"    },
  EUR: { color: "var(--currency-eur)", bg: "var(--bg-doing)"   },
  USD: { color: "var(--currency-usd)", bg: "var(--bg-warning)" },
} as const;

/**
 * Sidebar: ícones monocromáticos
 * Cor controlada pelas CSS vars --sidebar-text e --sidebar-text-active
 * O campo `color` aqui é apenas para compatibilidade — o Sidebar agora usa vars diretamente
 */
export const NAV_ACCENT = {
  home:       { color: "var(--sidebar-text)", bg: "var(--accent-muted)" },
  tasks:      { color: "var(--sidebar-text)", bg: "var(--accent-muted)" },
  notes:      { color: "var(--sidebar-text)", bg: "var(--accent-muted)" },
  calendar:   { color: "var(--sidebar-text)", bg: "var(--accent-muted)" },
  expenses:   { color: "var(--sidebar-text)", bg: "var(--accent-muted)" },
  shared:     { color: "var(--sidebar-text)", bg: "var(--accent-muted)" },
  reports:    { color: "var(--sidebar-text)", bg: "var(--accent-muted)" },
  members:    { color: "var(--sidebar-text)", bg: "var(--accent-muted)" },
  imigracao:  { color: "var(--sidebar-text)", bg: "var(--accent-muted)" },
} as const;

/** Tokens de ação de log */
export const LOG_ACTION = {
  create: { color: "var(--color-done)",    bg: "var(--bg-done)"    },
  update: { color: "var(--color-doing)",   bg: "var(--bg-doing)"   },
  delete: { color: "var(--color-danger)",  bg: "var(--bg-danger)"  },
} as const;
