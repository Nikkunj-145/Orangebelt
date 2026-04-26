import {
  rpc,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Address,
  Account,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import { CONTRACT_ID, NETWORK_PASSPHRASE, RPC_URL } from './config';
import { signXdr } from './wallet';

export const server = new rpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith('http://') });

export interface Wish {
  id: number;
  author: string;
  text: string;
  tag: string;
  ledger: number;
  timestamp: number; // ms
}

function getContract(): Contract {
  if (!CONTRACT_ID) throw new Error('VITE_CONTRACT_ID is not set.');
  return new Contract(CONTRACT_ID);
}

async function simulateRead(method: string, args: xdr.ScVal[] = []) {
  const contract = getContract();
  const dummy = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOOO';
  const account = new Account(dummy, '0');
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  if (!('result' in sim) || !sim.result) throw new Error('No simulation result');
  return scValToNative(sim.result.retval);
}

function normalizeWish(raw: any): Wish {
  return {
    id: Number(raw.id),
    author: String(raw.author),
    text: String(raw.text),
    tag: String(raw.tag ?? ''),
    ledger: Number(raw.ledger),
    timestamp: Number(raw.timestamp ?? 0) * 1000,
  };
}

export async function fetchCount(): Promise<number> {
  const v = await simulateRead('count');
  return Number(v);
}

export async function fetchRecent(n: number = 25): Promise<Wish[]> {
  const arr = (await simulateRead('recent', [
    nativeToScVal(n, { type: 'u32' }),
  ])) as any[];
  return arr.map(normalizeWish);
}

export async function postWish(
  author: string,
  text: string,
  tag: string,
): Promise<{ hash: string; id: number }> {
  const contract = getContract();
  const account = await server.getAccount(author);
  const builtTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'post',
        new Address(author).toScVal(),
        nativeToScVal(text, { type: 'string' }),
        nativeToScVal(tag, { type: 'string' }),
      ),
    )
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(builtTx);
  const signedXdr = await signXdr(prepared.toXDR(), author);
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const send = await server.sendTransaction(signedTx);
  if (send.status === 'ERROR') {
    throw new Error(`Send failed: ${JSON.stringify(send.errorResult ?? send)}`);
  }
  const hash = send.hash;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const status = await server.getTransaction(hash);
    if (status.status === 'SUCCESS') {
      // Decode return value (id)
      let id = 0;
      try {
        const ret = (status as any).returnValue;
        if (ret) id = Number(scValToNative(ret));
      } catch {}
      return { hash, id };
    }
    if (status.status === 'FAILED') throw new Error('Transaction failed on-chain');
  }
  throw new Error('Transaction timed out');
}
