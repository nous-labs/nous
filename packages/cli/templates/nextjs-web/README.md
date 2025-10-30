# Qubic Next.js Starter

This template layers Nous Labs tooling on top of a fresh un create next-app --ts --tailwind project. After generation you will have:

- @nouslabs/sdk and @nouslabs/react wired into a root provider
- React Query configured for data fetching
- WalletConnect scaffolding with a placeholder project id
- Example components showing authentication and balance queries

## Next steps

`ash
cp env.example .env.local
npm run dev   # or pnpm/bun/yarn
`

Replace the WalletConnect project id in .env.local before connecting wallets.
