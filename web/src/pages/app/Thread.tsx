import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sendMessage, subscribeToMessages, type Message } from '../../lib/messages';

export function Thread() {
  const { id } = useParams<{ id: string }>();
  const { firebaseUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Real-time: messages stream in via onSnapshot (no polling).
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToMessages(id, (next) => {
      setMessages(next);
      setLoading(false);
    });
    return unsubscribe;
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSend = async () => {
    if (!id || text.trim().length === 0 || sending) return;
    const body = text.trim();
    setText('');
    setSending(true);
    try {
      // The snapshot listener renders the new message; no manual refetch.
      await sendMessage(id, body);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] w-full max-w-xl flex-col px-4">
      <div className="mb-2">
        <Link to="/app/messages" className="text-sm text-text-muted">← Messages</Link>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto py-2">
        {loading ? (
          <p className="text-center text-sm text-text-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-text-muted">Say hello 👋</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === firebaseUser?.uid;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? 'bg-gradient-brand text-white' : 'bg-surface'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-border py-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void onSend();
          }}
          placeholder="Message…"
          className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-brand-magenta"
        />
        <button
          type="button"
          onClick={() => void onSend()}
          disabled={text.trim().length === 0 || sending}
          className="rounded-full bg-gradient-brand px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
