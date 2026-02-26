import { useState } from 'react';
import { getCustomerTokenIfPresent } from '../../lib/api';
import { feedbackApi } from '../../lib/api';
import { Navigate } from 'react-router-dom';

export function UserFeedbackPage() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const hasToken = !!getCustomerTokenIfPresent();

  if (!hasToken) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setSending(true);
    setError('');
    try {
      await feedbackApi.submit(text);
      setSent(true);
      setMessage('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send feedback');
    } finally {
      setSending(false);
    }
  };

  const cardClass = 'user-card rounded-2xl p-5 sm:p-6 min-w-0 shadow-[0_0_30px_-10px_rgba(0,0,0,0.15)] opacity-0 animate-fade-in-up';
  const inputClass = 'w-full min-h-[120px] rounded-xl border px-4 py-3 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/50 outline-none transition resize-y';

  return (
    <div className="max-w-md mx-auto space-y-6 pb-8 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent opacity-0 animate-fade-in-up">
        Feedback
      </h1>
      <p className="user-text-muted text-sm -mt-2 opacity-0 animate-fade-in-up">Tell us what we can improve. We track your feedback so we can serve you better.</p>

      {sent ? (
        <div className={`${cardClass} border-emerald-500/30 bg-emerald-500/10`}>
          <p className="text-emerald-600 font-medium">Thank you!</p>
          <p className="user-text-muted text-sm mt-1">Your feedback has been sent.</p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-3 text-sm text-cyan-600 font-medium hover:text-cyan-500"
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={cardClass}>
          <label htmlFor="feedback-message" className="block text-sm font-medium user-text-muted mb-2">
            Your feedback / What we can improve
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Faster check-in, better rewards..."
            className={inputClass}
            style={{ borderColor: 'var(--user-border-subtle)', backgroundColor: 'var(--user-input-bg)', color: 'var(--user-text)' }}
            maxLength={2000}
            rows={4}
            disabled={sending}
          />
          <p className="user-text-subtle text-xs mt-1">{message.length}/2000</p>
          {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="hover-user-bg w-full min-h-[48px] mt-4 rounded-xl border font-medium transition disabled:opacity-50 disabled:pointer-events-none"
            style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}
          >
            {sending ? 'Sending…' : 'Send feedback'}
          </button>
        </form>
      )}
    </div>
  );
}
