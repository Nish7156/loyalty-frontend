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
      <span className="user-request-badge-pending inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
        Pending
      </span>
    );
  }
  if (s === 'APPROVED') {
    return (
      <span className="user-request-badge-approved inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
        Approved
      </span>
    );
  }
  if (s === 'REJECTED') {
    return (
      <span className="user-request-badge-rejected inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
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

  const emptyCardClass =
    'user-card user-request-card rounded-2xl p-6 sm:p-8 text-center border border-[var(--user-border-subtle)]';

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 px-4 pt-2">
        <HistorySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 px-4 pt-2 pb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">
          My Requests
        </h1>
        <div className={emptyCardClass}>
          <p className="text-rose-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full min-w-0 px-4 pt-2 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">
          My Requests
        </h1>
        <p className="user-text-muted text-sm mt-1.5">Pending, approved, or rejected — staff approve when free.</p>
      </div>

      {requests.length === 0 ? (
        <div className={emptyCardClass}>
          <p className="user-text-muted text-sm">No check-in requests yet. Scan a store QR to check in — your requests will appear here.</p>
        </div>
      ) : (
        <ul className="grid gap-4 list-none p-0 m-0">
          {requests.map((a) => {
            const status = a.status.toUpperCase();
            const accent =
              status === 'PENDING'
                ? 'from-amber-500 to-amber-400'
                : status === 'APPROVED'
                  ? 'from-emerald-500 to-emerald-400'
                  : 'from-rose-500 to-rose-400';
            return (
              <li
                key={a.id}
                className="user-card user-request-card rounded-2xl overflow-hidden border border-[var(--user-border-subtle)] transition"
              >
                <div className={`h-1 w-full bg-gradient-to-r ${accent}`} aria-hidden />
                <div className="p-5 sm:p-6 flex gap-4 items-start justify-between">
                  <div className="flex gap-4 items-start min-w-0 flex-1">
                    <div className="user-request-avatar shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--user-hover)]">
                      <span className="text-lg font-semibold text-cyan-500" aria-hidden>
                        {(a.branch?.branchName ?? '?').charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="user-text font-semibold text-base">{a.branch?.branchName ?? 'Check-in'}</p>
                        <StatusBadge status={a.status} />
                      </div>
                      {a.partner?.businessName && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="user-text-subtle text-sm">{a.partner.businessName}</span>
                        </div>
                      )}
                      {a.value != null && a.value > 0 && (
                        <div className="user-request-amount inline-flex items-baseline gap-1.5 rounded-lg px-2.5 py-1 bg-[var(--user-hover)]">
                          <span className="user-text-subtle text-xs uppercase tracking-wide">Amount</span>
                          <span className="user-text font-semibold text-sm">${Number(a.value).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="user-text-subtle text-xs shrink-0 text-right whitespace-nowrap">{formatDateTime(a.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
