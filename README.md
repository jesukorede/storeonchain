# Store Onchain

A hybrid Web3 marketplace connecting Africa’s local sellers and global buyers — with escrow on Hedera, Firebase auth and database, and wallet-based checkout.

## Vision

- Decentralized commerce for physical goods (fashion, gadgets, art, furniture).
- Trust via on-chain escrow and real-time verification.
- Crypto-first, with a path to fiat bridges.
- Lightweight, mobile-friendly UX with shared UI primitives.

## Problem

- Local sellers lack reach and cross-border payments.
- Buyers face trust issues (fake listings, delivery risks).
- Traditional marketplaces don’t support crypto.
- Few Web3-native marketplaces for real goods in Africa.

## Solution

- Web marketplace with product listing, filters, and seller dashboard.
- Payments protected by escrow smart contracts; wallet-based signing.
- Realtime updates via Socket.IO and API verification.
- Firebase for identity, profiles, and product data.

## Core Features (MVP Implemented)

- Products: list, filter, and view items from Firestore.
- Sell: create a listing with:
  - Fully editable price (no forced “0” value).
  - Upload up to 3 images to Firebase Storage.
  - Choose token (`HBAR` or `USDC`) and category.
- Profile: Google sign-in, update display name, bio, and avatar.
- Escrow: prepare unsigned transaction, sign in wallet, verify on backend.
- Wallets: Hedera WalletConnect v2 via Reown packages; fallback to `window.ethereum`.
- Realtime: Socket.IO events for orders and escrow status.

## Roadmap

- AI Market Scanner (best deals, quality, reputation).
- Crypto ↔ Fiat bridge (e.g., via Poko or HashPort).
- On-chain promotions (contract events + fee incentives).
- Tokenized loyalty and rewards.
- Logistics providers integration and delivery verification.

## Monorepo Structure

- `apps/web` — Next.js frontend (Pages: `home`, `products`, `sell`, `profile`, `escrow`).
- `apps/api` — Express backend (products, orders, promotions, events, escrow).
- `contracts` — Hedera-compatible escrow contract (Hardhat).
- `scripts` — utilities (token creation, transfer, HCS logs).
- `firestore.rules`, `storage.rules` — Firebase security rules.

## Tech Stack

- Web: Next.js 14, Tailwind CSS, React 18.
- State: lightweight client state + context providers; optional RxDB v16 cache.
- Wallets: `@hashgraph/hedera-wallet-connect` with `@reown/appkit`, `@reown/walletkit`.
- Backend: Express, Socket.IO, Zod, Firebase Admin.
- Chain: Hedera JSON-RPC via Hashio; EVM contract and events.
- Storage/DB: Firebase Storage and Firestore.

## Environment

- `apps/web/.env` (client):
  - `NEXT_PUBLIC_API_BASE_URL` — e.g., `http://localhost:4000`
  - `NEXT_PUBLIC_WEB_ORIGIN` — e.g., `http://localhost:3000`
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
  - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
  - Optional: `NEXT_PUBLIC_NETWORK` (`testnet` or `mainnet`)
- `apps/api/.env` (server):
  - `PORT=4000`
  - `ESCROW_CONTRACT_ADDRESS=<deployed address>`
  - `HEDERA_RPC_URL=https://testnet.hashio.io/api`
  - `FIREBASE_SERVICE_ACCOUNT_JSON=<full JSON string or use ADC>`
  - Optional HCS: `HEDERA_TOPIC_ID`, plus operator keys.
- `contracts/.env`:
  - `HEDERA_PRIVATE_KEY`
  - `HEDERA_RPC_URL`

## Setup

Install dependencies:

```bash
npm install
```

Run API dev:

```bash
npm run dev -w apps/api
```

Run Web dev:

```bash
npm run dev -w apps/web
```

Build & start:

```bash
npm run build -w apps/api
```

```bash
npm run start -w apps/api
```

```bash
npm run build -w apps/web
```

```bash
npm run start -w apps/web
```

## Firebase Rules

Firestore (users can read/write their own profile):

```plaintext
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Storage (avatars restricted; products public or owner-only):

```plaintext
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Avatars
    match /avatars/{uid}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    // Product images (temporary)
    match /products/public/{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
    match /products/{uid}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Note: `Sell` page uploads to `products/${user?.uid || "public"}`; unauthenticated users can still list images under `public` with the temporary rule above.

## Hedera WalletConnect v2

Web uses:
- `@hashgraph/hedera-wallet-connect`
- `@reown/appkit`, `@reown/walletkit`
- `@walletconnect/universal-provider`

Next.js transpiles these via `transpilePackages` and includes a shim alias for `@reown/appkit/adapters`. Ensure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set. The wallet provider falls back to `window.ethereum` if HWC is unavailable.

## Escrow Flow

1. Seller creates product; buyer starts checkout and opens `/escrow`.
2. Web calls `POST /api/escrow/prepare/lock` with `orderId`, `seller`, `deadline`, `amountWei`.
3. API encodes EVM call `lock(bytes32,address,uint256)` and returns unsigned tx.
4. Web requests wallet signature via `eth_sendTransaction` and shows Hashscan link.
5. API verifies the tx, parses logs, emits Socket.IO events (`escrow:locked`, etc.), and persists status.

## API Summary

- `GET /api/products` — list products (Firestore).
- `POST /api/products` — create product (supports `imageUrls` up to 3).
- `POST /api/orders` — create order (persist + Socket.IO).
- `POST /api/promotions` — placeholder promotions.
- `POST /api/events` — HCS messages (optional).
- `POST /api/escrow/prepare/lock` — encode lock tx.
- `POST /api/escrow/verify` — verify tx hash and escrow logs.

## Deployment

Backend (Render):
- Build: `npm run build -w apps/api`
- Start: `npm run start -w apps/api`
- Env vars: `ESCROW_CONTRACT_ADDRESS`, `HEDERA_RPC_URL`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `CORS_ORIGIN=https://<your-vercel-domain>`
- Render sets `PORT` automatically.

Frontend (Vercel):
- Root Directory: `apps/web`
- Env vars: `NEXT_PUBLIC_API_BASE_URL=https://<your-render-domain>`, Firebase keys, WalletConnect ID, optional `NEXT_PUBLIC_NETWORK`
- Next.js config transpiles Reown packages and includes adapter shim.

## Dev Notes

- Use `rxjs@7` with RxDB v16 (`rxjs/operators` exists in v7, not v8).
- Products page ignores `AbortError` from effect cleanup.
- Sell page:
  - Price is fully editable; parsed on submit; must be `> 0`.
  - Upload up to 3 images; previews shown before publish.

## Security

- Keep service account keys out of VCS; `.gitignore` excludes them.
- Use rate limiting, Helmet, CORS, and compression in API.
- Tighten Storage rules later by removing public writes and requiring auth.

## Troubleshooting

- Module resolution (Reown/AppKit): ensure packages installed and Next `transpilePackages` configured.
- Wallets: verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` and Hedera chain.
- Escrow: confirm contract address, function signature, and wallet has network access.
- Firebase Storage: if uploads fail, check rules and project IDs.

## License

Internal project. No license headers added.