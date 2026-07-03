import React, { useMemo, useState } from 'react';
import { AppState } from './types';
import { AlertTriangle, X, Bell, CheckCircle, Info, Calendar, ChevronDown, ChevronUp, Shield } from 'lucide-react';

interface Alert {
  id: string;
  level: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface AlertsPanelProps {
  state: AppState;
  onDismiss: (id: string) => void;
  dismissedAlerts: string[];
}

const levelStyles: Record<string, React.CSSProperties> = {
  critical: { borderColor: 'var(--border)', background: 'var(--bg-danger)' },
  warning:  { borderColor: 'var(--border)', background: 'var(--bg-warning)' },
  info:     { borderColor: 'var(--border)', background: 'var(--accent-muted)' },
  success:  { borderColor: 'var(--border)', background: 'var(--bg-done)' },
};

const levelBorderLeftColors: Record<string, string> = {
  critical: 'var(--color-danger)',
  warning:  'var(--color-warning)',
  info:     'var(--accent)',
  success:  'var(--color-done)',
};

const levelIconColorStyles: Record<string, React.CSSProperties> = {
  critical: { color: 'var(--color-danger)' },
  warning:  { color: 'var(--color-warning)' },
  info:     { color: 'var(--accent)' },
  success:  { color: 'var(--color-done)' },
};

const levelTitleColorStyles: Record<string, React.CSSProperties> = {
  critical: { color: 'var(--color-danger)' },
  warning:  { color: 'var(--color-warning)' },
  info:     { color: 'var(--accent)' },
  success:  { color: 'var(--color-done)' },
};

export default function AlertsPanel({ state, onDismiss, dismissedAlerts }: AlertsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [hoveredDismiss, setHoveredDismiss] = useState<string | null>(null);
  const [headerHovered, setHeaderHovered] = useState(false);

  // Build today at local midnight (timezone-safe, avoids UTC offset)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Local date string helper
  const localDateStr = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const alerts: Alert[] = useMemo(() => {
    const computed: Alert[] = [];

    // --- Passport expiry alerts ---
    (state.familyMembers || []).forEach(member => {
      if (!member.name || !member.passportExpiry) return;
      const expiry = new Date(member.passportExpiry + 'T00:00:00');
      const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        computed.push({
          id: `passport_expired_${member.id}`,
          level: 'critical',
          title: `⚠️ Passaporte Vencido: ${member.name}`,
          description: `O passaporte de ${member.name} venceu em ${expiry.toLocaleDateString('pt-BR')}. Renove imediatamente!`,
          icon: <Shield className="w-4 h-4" />
        });
      } else if (daysLeft <= 30) {
        computed.push({
          id: `passport_critical_${member.id}`,
          level: 'critical',
          title: `⚠️ Passaporte Crítico: ${member.name}`,
          description: `Vence em ${daysLeft} dias (${expiry.toLocaleDateString('pt-BR')}). A maioria dos países exige 6 meses de validade. Renove urgentemente!`,
          icon: <Shield className="w-4 h-4" />
        });
      } else if (daysLeft <= 90) {
        computed.push({
          id: `passport_warning_${member.id}`,
          level: 'warning',
          title: `🛂 Passaporte Vence em Breve: ${member.name}`,
          description: `Vence em ${daysLeft} dias (${expiry.toLocaleDateString('pt-BR')}). Considere renovar com antecedência para não ter problemas de imigração.`,
          icon: <Shield className="w-4 h-4" />
        });
      }
    });

    // --- Upcoming calendar events (next 7 days) ---
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const tomorrowDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const tomorrowIso = localDateStr(tomorrowDate);
    void tomorrowIso; // used below in daysUntil === 1 check

    (state.events || []).forEach(ev => {
      const evDate = new Date(ev.date + 'T00:00:00');
      const daysUntil = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil === 1 && ev.notifyOneDayBefore) {
        computed.push({
          id: `event_tomorrow_${ev.id}`,
          level: 'warning',
          title: `🔔 Amanhã: ${ev.title}`,
          description: `${ev.time ? `às ${ev.time}` : 'Dia todo'} — ${ev.description || 'Você marcou para ser lembrado deste evento.'}`,
          icon: <Bell className="w-4 h-4" />
        });
      } else if (daysUntil === 0) {
        computed.push({
          id: `event_today_${ev.id}`,
          level: 'critical',
          title: `📌 Hoje: ${ev.title}`,
          description: `${ev.time ? `às ${ev.time}` : 'Dia todo'} — ${ev.description || 'Evento programado para hoje!'}`,
          icon: <Calendar className="w-4 h-4" />
        });
      } else if (daysUntil > 0 && daysUntil <= 7 && ev.notifyOneDayBefore) {
        computed.push({
          id: `event_upcoming_${ev.id}`,
          level: 'info',
          title: `📅 Em ${daysUntil} dia${daysUntil !== 1 ? 's' : ''}: ${ev.title}`,
          description: ev.description || `Evento programado para ${evDate.toLocaleDateString('pt-BR')}.`,
          icon: <Calendar className="w-4 h-4" />
        });
      }
    });

    // --- Document progress alerts ---
    const allDocs = Object.values(state.checklists || {}).flat();
    const docCount = allDocs.length;
    const docDone = allDocs.filter(d => d.completed).length;
    const docPct = docCount > 0 ? Math.round((docDone / docCount) * 100) : 0;

    if (docPct === 100 && docCount > 0) {
      computed.push({
        id: `docs_complete`,
        level: 'success',
        title: '✅ Documentação 100% Concluída!',
        description: 'Parabéns! Todos os documentos foram marcados como concluídos. Você está pronto para imigrar!',
        icon: <CheckCircle className="w-4 h-4" />
      });
    } else if (docPct >= 75) {
      computed.push({
        id: `docs_almost_done`,
        level: 'info',
        title: `📋 Documentos quase prontos (${docPct}%)`,
        description: `Faltam apenas ${docCount - docDone} documento(s) para completar sua lista. Continue!`,
        icon: <Info className="w-4 h-4" />
      });
    }

    // --- Finance alerts ---
    const totalEstimated = (state.financialExpenses || []).reduce((s, e) => s + (e.estimated || 0), 0);
    const totalReal = (state.financialExpenses || []).reduce((s, e) => s + (e.real || 0), 0);
    if (totalReal > totalEstimated * 1.1 && totalEstimated > 0) {
      computed.push({
        id: `budget_exceeded`,
        level: 'warning',
        title: '💸 Orçamento Excedido',
        description: `Os gastos reais já ultrapassaram o estimado em ${((totalReal / totalEstimated - 1) * 100).toFixed(0)}%. Revise seu planejamento financeiro.`,
        icon: <AlertTriangle className="w-4 h-4" />
      });
    }

    return computed.filter(a => !dismissedAlerts.includes(a.id));
  }, [state, dismissedAlerts]);

  if (alerts.length === 0) return null;

  const criticalCount = alerts.filter(a => a.level === 'critical').length;
  const warningCount = alerts.filter(a => a.level === 'warning').length;

  return (
    <div
      className="mb-5 rounded-2xl overflow-hidden shadow-xs no-print"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      {/* Header Row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: headerHovered ? 'var(--surface-2)' : 'var(--surface-2)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <Bell className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Central de Alertas</span>
          <div className="flex items-center gap-1.5">
            {criticalCount > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: 'var(--bg-danger)', color: 'var(--color-danger)', border: '1px solid var(--border)' }}
              >
                {criticalCount} crítico{criticalCount !== 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: 'var(--bg-warning)', color: 'var(--color-warning)', border: '1px solid var(--border)' }}
              >
                {warningCount} aviso{warningCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-faint)' }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-faint)' }} />
        )}
      </button>

      {/* Alerts List */}
      {expanded && (
        <div style={{ borderColor: 'var(--border-subtle)' }}>
          {alerts.map((alert, idx) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 px-4 py-3 transition-all"
              style={{
                ...levelStyles[alert.level],
                borderLeft: `4px solid ${levelBorderLeftColors[alert.level]}`,
                borderTop: idx > 0 ? '1px solid var(--border-subtle)' : undefined,
              }}
            >
              <span className="mt-0.5 flex-shrink-0" style={levelIconColorStyles[alert.level]}>
                {alert.icon || <Bell className="w-4 h-4" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={levelTitleColorStyles[alert.level]}>{alert.title}</p>
                <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{alert.description}</p>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(alert.id)}
                onMouseEnter={() => setHoveredDismiss(alert.id)}
                onMouseLeave={() => setHoveredDismiss(null)}
                className="flex-shrink-0 p-1 rounded-md cursor-pointer transition-colors"
                style={{
                  color: hoveredDismiss === alert.id ? 'var(--text-secondary)' : 'var(--text-faint)',
                  background: hoveredDismiss === alert.id ? 'var(--surface-2)' : 'transparent',
                }}
                title="Dispensar alerta"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
