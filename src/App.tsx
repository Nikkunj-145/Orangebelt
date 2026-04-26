import { useCallback, useEffect, useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { WalletBar } from './components/WalletBar';
import { PostForm, type PostStatus } from './components/PostForm';
import { WishWall } from './components/WishWall';
import { openWalletPicker, restoreWallet, disconnect as walletDisconnect } from './lib/wallet';
import { fetchRecent, postWish, type Wish } from './lib/wishboard';
import { CONTRACT_ID } from './lib/config';

export default function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PostStatus>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!CONTRACT_ID) return;
    try {
      const list = await fetchRecent(50);
      setWishes(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load wishes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    (async () => {
      const a = await restoreWallet();
      if (a) setAddress(a);
    })();
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  const handleConnect = async () => {
    setError(null);
    setConnecting(true);
    try {
      const a = await openWalletPicker();
      setAddress(a);
    } catch (e: any) {
      if (!String(e?.message ?? '').includes('cancelled')) {
        setError(e.message ?? String(e));
      }
    } finally {
      setConnecting(false);
    }
  };

  const handlePost = async (text: string, tag: string) => {
    if (!address) return;
    setStatus({ kind: 'pending', step: 'Awaiting signature…' });
    try {
      const { hash, id } = await postWish(address, text, tag);
      setStatus({ kind: 'success', hash, id });
      refresh();
    } catch (e: any) {
      const msg = String(e?.message || e);
      // Map known contract errors
      let pretty = msg;
      if (msg.includes('Error(Contract, #1)') || msg.includes('TextEmpty')) pretty = 'Text cannot be empty.';
      else if (msg.includes('Error(Contract, #2)') || msg.includes('TextTooLong')) pretty = 'Text exceeds 200 character limit.';
      else if (msg.includes('Error(Contract, #3)') || msg.includes('TagTooLong')) pretty = 'Tag exceeds 30 character limit.';
      else if (msg.toLowerCase().includes('user reject') || msg.toLowerCase().includes('declined')) pretty = 'Transaction rejected in wallet.';
      else if (msg.toLowerCase().includes('insufficient')) pretty = 'Insufficient balance — fund your account first.';
      setStatus({ kind: 'error', message: pretty });
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 sticky top-0 backdrop-blur z-10 bg-ink/60">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ember/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-ember" />
            </div>
            <div>
              <div className="font-bold tracking-tight">Stellar Wishboard</div>
              <div className="text-xs text-white/50">Orange Belt · Soroban Testnet</div>
            </div>
          </div>
          <WalletBar
            address={address}
            onConnect={handleConnect}
            onDisconnect={() => {
              walletDisconnect();
              setAddress(null);
              setStatus({ kind: 'idle' });
            }}
            loading={connecting}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {!CONTRACT_ID && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-amber-200 mb-1">
              <AlertCircle className="w-4 h-4" /> Contract not configured
            </div>
            <span className="text-amber-200/80">
              Set <code>VITE_CONTRACT_ID</code> in <code>.env.local</code>.
            </span>
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <div className="text-red-200">{error}</div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <PostForm connected={!!address} onPost={handlePost} status={status} />
          <WishWall wishes={wishes} loading={loading} />
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-white/30">
        Built with Soroban + StellarWalletsKit · Orange Belt submission
      </footer>
    </div>
  );
}
