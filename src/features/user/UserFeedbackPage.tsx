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

  const cardClass = 'rounded-2xl p-5 sm:p-6 min-w-0 border border-white/10 bg-white/[0.04] shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)] opacity-0 animate-fade-in-up';
  const inputClass = 'w-full min-h-[120px] rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/50 outline-none transition resize-y';

  return (
    <div className="max-w-md mx-auto space-y-6 pb-8 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-transparent opacity-0 animate-fade-in-up">
        Feedback
      </h1>
      <p className="text-white/60 text-sm -mt-2 opacity-0 animate-fade-in-up">Tell us what we can improve. We track your feedback so we can serve you better.</p>

      {sent ? (
        <div className={`${cardClass} border-emerald-500/30 bg-emerald-500/10`}>
          <p className="text-emerald-300 font-medium">Thank you!</p>
          <p className="text-white/70 text-sm mt-1">Your feedback has been sent.</p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-3 text-sm text-cyan-400 font-medium hover:text-cyan-300"
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={cardClass}>
          <label htmlFor="feedback-message" className="block text-sm font-medium text-white/70 mb-2">
            Your feedback / What we can improve
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Faster check-in, better rewards..."
            className={inputClass}
            maxLength={2000}
            rows={4}
            disabled={sending}
          />
          <p className="text-white/40 text-xs mt-1">{message.length}/2000</p>
          {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="w-full min-h-[48px] mt-4 rounded-xl border border-white/40 text-white font-medium hover:bg-white/10 transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {sending ? 'Sending…' : 'Send feedback'}
          </button>
        </form>
      )}
    </div>
  );
}
