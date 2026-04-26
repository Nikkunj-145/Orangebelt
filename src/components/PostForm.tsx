import { useState } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { explorerTx } from '../lib/format';

const MAX_TEXT = 200;
const MAX_TAG = 30;

export type PostStatus =
  | { kind: 'idle' }
  | { kind: 'pending'; step: string }
  | { kind: 'success'; hash: string; id: number }
  | { kind: 'error'; message: string };

interface Props {
  connected: boolean;
  onPost: (text: string, tag: string) => Promise<void>;
  status: PostStatus;
}

export function PostForm({ connected, onPost, status }: Props) {
  const [text, setText] = useState('');
  const [tag, setTag] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onPost(text.trim(), tag.trim());
    if (status.kind !== 'error') {
      setText('');
      setTag('');
    }
  };

  const remaining = MAX_TEXT - text.length;
  const overLimit = remaining < 0;

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Post a wish</h2>
        <span className={`text-xs tabular-nums ${overLimit ? 'text-red-400' : 'text-white/40'}`}>
          {remaining} chars left
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Drop a wish, message, or shout-out for the world to see… (max 200 chars)"
        rows={3}
        maxLength={MAX_TEXT + 10}
        className="input resize-none"
        disabled={!connected || status.kind === 'pending'}
      />

      <input
        value={tag}
        onChange={(e) => setTag(e.target.value.slice(0, MAX_TAG))}
        placeholder="Tag (optional, e.g. wish, shoutout, build)"
        className="input"
        disabled={!connected || status.kind === 'pending'}
      />

      <button
        type="submit"
        disabled={!connected || !text.trim() || overLimit || status.kind === 'pending'}
        className="btn btn-primary w-full"
      >
        {status.kind === 'pending' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> {status.step}
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            {connected ? 'Post on-chain' : 'Connect wallet to post'}
          </>
        )}
      </button>

      {status.kind === 'success' && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <CheckCircle2 className="w-4 h-4" /> Posted! Wish #{status.id}
          </div>
          <a
            href={explorerTx(status.hash)}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-ember hover:underline inline-flex items-center gap-1"
          >
            View tx <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {status.kind === 'error' && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm">
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
            <AlertCircle className="w-4 h-4" /> Failed
          </div>
          <div className="text-white/70 text-xs break-words">{status.message}</div>
        </div>
      )}
    </form>
  );
}
