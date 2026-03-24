import { useEffect, useState } from 'react';
import { customersApi } from '../../lib/api';
import { HistorySkeleton } from '../../components/Skeleton';
import type { HistoryActivity } from '../../lib/api';

const CHECKIN_UPDATED_EVENT = 'loyalty_checkin_updated';

function formatDateTime(s: string) {
  try {
    return new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return s;
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  if (s === 'PENDING') {
    return (
      <span className="user-request-badge-pending inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: '#FFF8E1', color: '#F9A825', border: '1px solid #FFE082' }}>
        Pending
      </span>
    );
  }
  if (s === 'APPROVED') {
    return (
      <span className="user-request-badge-approved inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: '#E4F2EB', color: '#2A6040', border: '1px solid rgba(42,96,64,0.2)' }}>
        Approved
      </span>
    );
  }
  if (s === 'REJECTED') {
    return (
      <span className="user-request-badge-rejected inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: '#FDEEE9', color: '#B03A2A', border: '1px solid rgba(176,58,42,0.2)' }}>
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: '#FAF9F6', color: '#7B5E54', border: '1px solid #FAECE7' }}>
      {status}
    </span>
  );
}

export function UserRequestsPage() {
  const [requests, setRequests] = useState<HistoryActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = () => {
    setError('');
    customersApi
      .getMyRequests()
      .then(setRequests)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, []);

  useEffect(() => {
    const handler = () => fetchRequests();
    window.addEventListener(CHECKIN_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CHECKIN_UPDATED_EVENT, handler);
  }, []);

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0">
        <HistorySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight" style={{ color: '#D85A30' }}>
          My Requests
        </h1>
        <div className="rounded-2xl p-6 sm:p-8 text-center" style={{ background: '#FFF', border: '1px solid #FAECE7' }}>
          <p className="text-sm" style={{ color: '#B03A2A' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: '#D85A30' }}>
          My Requests
        </h1>
        <p className="text-sm mt-1.5" style={{ color: '#7B5E54' }}>Pending, approved, or rejected — staff approve when free.</p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl p-6 sm:p-8 text-center" style={{ background: '#FFF', border: '1px solid #FAECE7' }}>
          <p className="text-sm" style={{ color: '#A08880' }}>No check-in requests yet. Scan a store QR to check in — your requests will appear here.</p>
        </div>
      ) : (
        <ul className="grid gap-4 list-none p-0 m-0">
          {requests.map((a) => {
            const status = a.status.toUpperCase();
            const accentColor =
              status === 'PENDING'
                ? '#F9A825'
                : status === 'APPROVED'
                  ? '#2A6040'
                  : '#B03A2A';
            return (
              <li
                key={a.id}
                className="rounded-2xl overflow-hidden transition"
                style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}
              >
                <div className="h-1 w-full" style={{ background: accentColor }} aria-hidden />
                <div className="p-5 sm:p-6 flex gap-4 items-start justify-between">
                  <div className="flex gap-4 items-start min-w-0 flex-1">
                    <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#FAECE7' }}>
                      <span className="text-lg font-semibold" style={{ color: '#D85A30' }} aria-hidden>
                        {(a.branch?.branchName ?? '?').charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-base" style={{ color: '#5D4037' }}>{a.branch?.branchName ?? 'Check-in'}</p>
                        <StatusBadge status={a.status} />
                      </div>
                      {a.partner?.businessName && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-rounded shrink-0 opacity-70" style={{ fontSize: '14px', color: '#A08880' }}>apartment</span>
                          <span className="text-sm" style={{ color: '#A08880' }}>{a.partner.businessName}</span>
                        </div>
                      )}
                      {a.value != null && a.value > 0 && (
                        <div className="inline-flex items-baseline gap-1.5 rounded-lg px-2.5 py-1" style={{ background: '#FAECE7' }}>
                          <span className="text-xs uppercase tracking-wide" style={{ color: '#A08880' }}>Amount</span>
                          <span className="font-semibold text-sm" style={{ color: '#5D4037' }}>₹{Number(a.value).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs shrink-0 text-right whitespace-nowrap" style={{ color: '#A08880' }}>{formatDateTime(a.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
