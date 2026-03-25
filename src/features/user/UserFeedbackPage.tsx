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

  const cardStyle = {
    background: 'var(--s)',
    border: '1px solid var(--bdl)',
    boxShadow: '0 1px 3px rgba(26,24,22,0.05)',
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-8 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight opacity-0 animate-fade-in-up" style={{ color: 'var(--a)' }}>
        Feedback
      </h1>
      <p className="text-sm -mt-2 opacity-0 animate-fade-in-up" style={{ color: 'var(--t2)' }}>Tell us what we can improve. We track your feedback so we can serve you better.</p>

      {sent ? (
        <div className="rounded-2xl p-5 sm:p-6 min-w-0 opacity-0 animate-fade-in-up" style={{ background: 'var(--grbg)', border: '1px solid rgba(42,96,64,0.2)' }}>
          <p className="font-medium" style={{ color: 'var(--gr)' }}>Thank you!</p>
          <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>Your feedback has been sent.</p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-3 text-sm font-medium"
            style={{ color: 'var(--a)' }}
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 sm:p-6 min-w-0 opacity-0 animate-fade-in-up" style={cardStyle}>
          <label htmlFor="feedback-message" className="block text-sm font-medium mb-2" style={{ color: 'var(--t2)' }}>
            Your feedback / What we can improve
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Faster check-in, better rewards..."
            className="w-full min-h-[120px] rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-300/40 outline-none transition resize-y"
            style={{ border: '1px solid var(--bd)', background: 'var(--bg)', color: 'var(--t)' }}
            maxLength={2000}
            rows={4}
            disabled={sending}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{message.length}/2000</p>
          {error && <p className="text-sm mt-2" style={{ color: 'var(--re)' }}>{error}</p>}
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="w-full min-h-[48px] mt-4 rounded-xl font-medium transition disabled:opacity-50 disabled:pointer-events-none"
            style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--bg)' }}
          >
            {sending ? 'Sending…' : 'Send feedback'}
          </button>
        </form>
      )}
    </div>
  );
}
