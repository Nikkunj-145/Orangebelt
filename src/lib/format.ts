export function shortAddr(addr: string) {
  if (!addr) return '';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
export function explorerTx(h: string) {
  return `https://stellar.expert/explorer/testnet/tx/${h}`;
}
export function explorerContract(id: string) {
  return `https://stellar.expert/explorer/testnet/contract/${id}`;
}
export function relTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
