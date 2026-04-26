# 🟠 Stellar Wishboard — Orange Belt

A **public, on-chain message wall** built on Stellar Soroban (testnet). Anyone connects a wallet, posts a 200-char wish/message with an optional tag, and the entire wall is rendered live from contract state.

> **Stellar Frontend Challenge — Level 3 (Orange Belt) submission.**

---

## 🚀 Live deployment

| Item             | Value |
| ---------------- | ----- |
| **Network**      | Stellar Testnet |
| **Contract ID**  | `CDIT3XHXLYZPPM5YBVOPFX3RGQBLBIYQYH4BXFOD5I2YZPE2ZRPWTWEL` |
| **Wasm hash**    | `96ff376dec883338d96a5eaccebbf3c782725d4e372b113adc5c2d911acb4bc7` |
| **Explorer**     | [stellar.expert](https://stellar.expert/explorer/testnet/contract/CDIT3XHXLYZPPM5YBVOPFX3RGQBLBIYQYH4BXFOD5I2YZPE2ZRPWTWEL) |

---

## ✨ Features

- 🪪 **Multi-wallet** via StellarWalletsKit (Freighter, xBull, Albedo, Lobstr, Hana)
- ✍️ Post on-chain wishes / shout-outs (max 200 chars)
- 🏷️ Optional tags (max 30 chars) → click to filter the wall
- 🔍 Full-text search across the wall
- ⏱️ Auto-refresh every 8 s
- 📊 Char counter, validation, status states (idle → pending → success/error)
- 🎯 **3+ contract errors** mapped to friendly UI:
  - `TextEmpty` (1) — empty post
  - `TextTooLong` (2) — exceeds 200 chars
  - `TagTooLong` (3) — tag exceeds 30 chars
  - `NotFound` (4) — unknown wish id
- ✅ **6 unit tests** all passing
- 📜 Reads via `simulateTransaction` (gas-free), writes via prepared + signed tx

---

## 🧪 Tests

```bash
cargo test --manifest-path contracts/wishboard/Cargo.toml
```

```
running 6 tests
test test::count_increments ...........  ok
test test::empty_text_rejected ........  ok
test test::not_found_for_unknown_id ...  ok
test test::post_and_get ...............  ok
test test::recent_newest_first ........  ok
test test::too_long_text_rejected .....  ok

test result: ok. 6 passed; 0 failed
```

---

## 🧰 Tech stack

| Layer       | Tech |
| ----------- | ---- |
| Contract    | Rust + `soroban-sdk` 22 |
| Frontend    | React 18 + Vite + TypeScript |
| Styling     | TailwindCSS + Lucide |
| Wallets     | StellarWalletsKit |
| Stellar SDK | `@stellar/stellar-sdk` 13 (Soroban RPC) |

---

## 📁 Structure

```
orange_belt/
├── contracts/wishboard/
│   ├── src/lib.rs        # Wishboard contract
│   ├── src/test.rs       # 6 unit tests
│   └── Cargo.toml
├── src/
│   ├── components/       # WalletBar, PostForm, WishWall
│   ├── lib/              # config, wallet, wishboard, format
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── deployment.json
├── .env.example
└── README.md
```

---

## 🛠️ Setup

### Prerequisites
- Node 18+
- Rust + `wasm32v1-none` target
- Stellar CLI ≥22
- A wallet extension (Freighter recommended) on **testnet**

### Run frontend
```bash
git clone https://github.com/Nikkunj-145/Orangebelt.git
cd Orangebelt
npm install
cp .env.example .env.local   # already pre-filled with deployed contract
npm run dev
```
Open http://localhost:5175

### Re-deploy contract
```bash
stellar contract build
stellar contract deploy `
  --wasm target/wasm32v1-none/release/wishboard.wasm `
  --source <your-identity> --network testnet
```
No `init` step needed — counter starts at 0.

---

## 🧠 How it works

1. **Read state** — `count` and `recent(n)` are read by simulating a tx with a dummy account. No signing, no fees.
2. **Post a wish** — build → `prepareTransaction` (auto-resolves auth + footprint) → wallet signs → `sendTransaction` → poll `getTransaction` until `SUCCESS` → return value (`id`) decoded with `scValToNative`.
3. **Validation** — runs in both UI (instant) and contract (authoritative). Contract errors map to readable UI messages.
4. **Live feed** — the wall auto-refetches every 8 s.

---

## ✅ Submission checklist (Orange Belt)

- [x] Mini-dApp end-to-end (wallet → contract → frontend)
- [x] **6 unit tests passing** (≥ 3 required)
- [x] Multi-wallet support
- [x] Comprehensive README with screenshots placeholders
- [x] **3+ commits**
- [x] Deployed contract on testnet
- [ ] Demo video URL (record + add link)
- [ ] Live demo URL (Vercel / Netlify deploy)

---

## 📜 License

MIT © Nikkunj
