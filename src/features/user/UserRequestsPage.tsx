import { useEffect, useState } from 'react';
import { customersApi } from '../../lib/api';
import { HistorySkeleton } from '../../components/Skeleton';
import type { HistoryActivity } from '../../lib/api';

const CHECKIN_UPDATED_EVENT = 'loyalty_checkin_updated';

function formatDateTime(s: string) {
  try {
    return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return s;
  }
}

const STATUS = {
  PENDING:  { label: 'Pending',  color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', dot: true,  icon: 'schedule' },
  APPROVED: { label: 'Approved', color: 'var(--gr)', bg: 'var(--grbg)', border: 'var(--gr)', dot: true,  icon: 'check_circle' },
  REJECTED: { label: 'Rejected', color: 'var(--re)', bg: 'var(--rebg)', border: 'var(--re)', dot: false, icon: 'cancel' },
} as const;

function RequestCard({ a }: { a: HistoryActivity }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const key = a.status.toUpperCase() as keyof typeof STATUS;
  const cfg = STATUS[key] ?? { label: a.status, color: 'var(--t3)', bg: 'var(--bdl)', border: 'var(--bd)', dot: false, icon: 'info' };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: 'var(--s)',
        border: '1px solid var(--bdl)',
        borderRadius: 18,
        overflow: 'hidden',
        transform: pressed ? 'scale(0.98)' : hovered ? 'translateY(-2px)' : 'none',
        boxShadow: pressed ? 'none' : hovered
          ? '0 8px 20px -4px rgba(0,0,0,0.1)'
          : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'transform 0.25s cubic-bezier(.23,1,.32,1), box-shadow 0.25s ease',
      }}
    >
      {/* Accent top bar */}
      <div style={{ height: 3, background: cfg.color, width: '100%' }} />

      <div style={{ padding: '14px 14px 14px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>

          {/* Store letter avatar */}
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'var(--bdl)', border: '1px solid var(--bd)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
          }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--a)' }}>
              {(a.branch?.branchName ?? '?').charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                {a.partner?.businessName && (
                  <p style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 1 }}>
                    {a.partner.businessName}
                  </p>
                )}
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.branch?.branchName ?? 'Check-in'}
                </p>
              </div>

              {/* Status badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: cfg.bg, borderRadius: 20, padding: '4px 9px 4px 6px',
                flexShrink: 0,
              }}>
                {cfg.dot && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: cfg.color, display: 'inline-block',
                    animation: key === 'PENDING' ? 'pulse-dot 1.8s ease-in-out infinite' : 'none',
                  }} />
                )}
                <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
              </div>
            </div>

            {/* Amount + date row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {a.value != null && Number(a.value) > 0 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'var(--bdl)', border: '1px solid var(--bd)',
                  borderRadius: 8, padding: '3px 8px',
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 12, color: 'var(--a)' }}>currency_rupee</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t)' }}>{Number(a.value).toFixed(0)}</span>
                </div>
              )}
              <p style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto' }}>{formatDateTime(a.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserRequestsPage() {
  const [requests, setRequests] = useState<HistoryActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = () => {
    setError('');
    customersApi.getMyRequests()
      .then(setRequests)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); fetchRequests(); }, []);

  useEffect(() => {
    window.addEventListener(CHECKIN_UPDATED_EVENT, fetchRequests);
    return () => window.removeEventListener(CHECKIN_UPDATED_EVENT, fetchRequests);
  }, []);

  const pending  = requests.filter(r => r.status.toUpperCase() === 'PENDING');
  const approved = requests.filter(r => r.status.toUpperCase() === 'APPROVED');
  const rejected = requests.filter(r => r.status.toUpperCase() === 'REJECTED');

  if (loading) return <div className="max-w-md mx-auto w-full min-w-0"><HistorySkeleton /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 16 }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t)', letterSpacing: '-0.02em' }}>My Requests</h1>
        <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>Staff approve when they're free — check back soon.</p>
      </div>

      {error && (
        <div style={{ background: 'var(--rebg)', border: '1px solid var(--re)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--re)' }}>{error}</p>
        </div>
      )}

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--s)', border: '1px solid var(--bdl)', borderRadius: 18 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 48, color: 'var(--bd)' }}>receipt_long</span>
          <p style={{ fontWeight: 600, color: 'var(--t)', marginTop: 8 }}>No requests yet</p>
          <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>Scan a store QR to check in.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {pending.length > 0 && (
            <section>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 10 }}>
                Pending · {pending.length}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pending.map(a => <RequestCard key={a.id} a={a} />)}
              </div>
            </section>
          )}
          {approved.length > 0 && (
            <section>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 10 }}>
                Approved · {approved.length}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {approved.map(a => <RequestCard key={a.id} a={a} />)}
              </div>
            </section>
          )}
          {rejected.length > 0 && (
            <section>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 10 }}>
                Rejected · {rejected.length}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rejected.map(a => <RequestCard key={a.id} a={a} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
