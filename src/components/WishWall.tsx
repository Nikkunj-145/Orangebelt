import { useMemo, useState } from 'react';
import { ExternalLink, Hash, Search, Loader2 } from 'lucide-react';
import type { Wish } from '../lib/wishboard';
import { explorerContract, relTime, shortAddr } from '../lib/format';
import { CONTRACT_ID } from '../lib/config';

interface Props {
  wishes: Wish[];
  loading: boolean;
}

export function WishWall({ wishes, loading }: Props) {
  const [filter, setFilter] = useState('');

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const w of wishes) if (w.tag) set.add(w.tag);
    return Array.from(set).slice(0, 8);
  }, [wishes]);

  const filtered = useMemo(() => {
    if (!filter) return wishes;
    const f = filter.toLowerCase();
    return wishes.filter(
      (w) => w.text.toLowerCase().includes(f) || w.tag.toLowerCase().includes(f),
    );
  }, [wishes, filter]);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-bold text-lg">The Wall</h2>
        <span className="text-xs text-white/40">{wishes.length} on-chain</span>
        <div className="ml-auto relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search…"
            className="input pl-9 py-1.5 text-sm w-44"
          />
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(filter === t ? '' : t)}
              className={`tag transition ${
                filter === t ? 'ring-2 ring-rose/40' : 'hover:brightness-125'
              }`}
            >
              <Hash className="w-3 h-3" />
              {t}
            </button>
          ))}
        </div>
      )}

      {loading && wishes.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Loading wishes…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/40 text-sm">
          {wishes.length === 0
            ? '✨ No wishes yet — be the first to post one!'
            : 'No matches for that search.'}
        </div>
      ) : (
        <ul className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map((w) => (
            <li
              key={w.id}
              className="rounded-xl border border-white/5 bg-black/20 p-4 hover:border-white/10 transition"
            >
              <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                <span className="font-mono">#{w.id} · {shortAddr(w.author)}</span>
                <span>{relTime(w.timestamp)}</span>
              </div>
              <p className="text-white/90 leading-relaxed whitespace-pre-wrap break-words">
                {w.text}
              </p>
              {w.tag && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="tag">
                    <Hash className="w-3 h-3" />
                    {w.tag}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {CONTRACT_ID && (
        <div className="mt-5 pt-4 border-t border-white/5 text-center">
          <a
            href={explorerContract(CONTRACT_ID)}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-ember hover:underline inline-flex items-center gap-1"
          >
            {CONTRACT_ID.slice(0, 8)}…{CONTRACT_ID.slice(-6)}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
