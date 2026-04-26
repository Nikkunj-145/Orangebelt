export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID as string | undefined;
export const NETWORK_PASSPHRASE =
  (import.meta.env.VITE_NETWORK_PASSPHRASE as string) ||
  'Test SDF Network ; September 2015';
export const RPC_URL =
  (import.meta.env.VITE_RPC_URL as string) || 'https://soroban-testnet.stellar.org';
