# Nous Labs

> νοῦς (nous) - mind, intellect, reason

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

Developer tools for the Qubic blockchain. Build powerful applications with full type safety, modern async/await patterns, and universal compatibility.

**Monorepo for [Nous Labs](https://nous-labs.com)** developer tools.

## Packages

This monorepo contains:

- **[@nouslabs/sdk](./packages/sdk)** - TypeScript SDK for Qubic blockchain
- **[@nouslabs/cli](./packages/cli)** - Command-line tools for Qubic

## Repository Structure

```
packages/
├── sdk/      - TypeScript SDK (@nouslabs/sdk)
├── cli/      - Command-line tools (@nouslabs/cli)
docs/         - Documentation site
examples/     - Example applications
```

## Quick Start

### Install SDK

```bash
npm install @nouslabs/sdk
```

### Install CLI

```bash
npm install -g @nouslabs/cli
```

Or use with npx:

```bash
npx @nouslabs/cli info
```

## Features

### SDK (@nouslabs/sdk)

- **Four Authentication Methods** - MetaMask, Vault files, private seeds, WalletConnect
- **Full TypeScript Support** - Complete type definitions with strict mode
- **Universal Compatibility** - Works in browsers, Node.js, Bun, and Deno
- **Tree-Shakeable** - Import only what you need
- **Smart Contract Support** - Simplified querying with encoding/decoding utilities
- **React Integration** - First-class React support with hooks and providers
- **Modern APIs** - Clean async/await interfaces
- **Comprehensive Error Handling** - Typed errors with detailed messages

### CLI (@nouslabs/cli)

- **Network Info** - Get current tick and network status
- **Balance Checking** - Query account balances
- **Transaction History** - View recent transactions
- **Authentication** - Manage MetaMask, WalletConnect, and Vault (coming soon)

## Quick Start

### Query the Blockchain

```typescript
import { createQubicClient } from '@nouslabs/sdk';

// Create client
const qubic = createQubicClient();

// Get current tick
const { tickInfo } = await qubic.live.getTickInfo();
console.log(`Current tick: ${tickInfo.tick}`);

// Check balance
const identity = 'BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA';
const { balance } = await qubic.live.getBalance(identity);
console.log(`Balance: ${balance.balance} QUBIC`);

// Get transaction history
const { transactions } = await qubic.query.getTransactionsForIdentity(
  identity,
  { pagination: { offset: 0, size: 10 } }
);
```

### Authenticate Users

```typescript
import { QubicAuthProvider, useQubicAuth } from '@nouslabs/sdk/react';

function App() {
  return (
    <QubicAuthProvider persistSession={true}>
      <Dashboard />
    </QubicAuthProvider>
  );
}

function Dashboard() {
  const {
    connectWithMetaMask,
    connectWithSeed,
    isConnected,
    account
  } = useQubicAuth();

  if (isConnected) {
    return <p>Connected: {account.publicId}</p>;
  }

  return (
    <div>
      <button onClick={() => connectWithMetaMask()}>
        Connect MetaMask
      </button>
      <button onClick={() => connectWithSeed('your-seed')}>
        Connect with Seed
      </button>
    </div>
  );
}
```

### Query Smart Contracts

```typescript
import { queryQX, QUBIC_CONTRACTS } from '@nouslabs/sdk';

// Query QX exchange
const result = await queryQX(qubic.live, 1, {
  entityId: 123
});

// Or use the generic contract query
import { createQuery } from '@nouslabs/sdk';

const query = createQuery(QUBIC_CONTRACTS.QX, 1)
  .addInt32(123)
  .addInt64(1000n);

const response = await query.execute(qubic.live);
```

## CLI Usage

```bash
# Get network info
nous info

# Check balance
nous balance <identity>

# View transactions
nous tx <identity> --limit 10
```

See [CLI documentation](./packages/cli) for more details.

## Documentation

- [SDK Documentation](./packages/sdk) - Complete SDK reference
- [CLI Documentation](./packages/cli) - Command-line tools guide
- [Examples](./examples) - Working example applications
- [Full Docs Site](./docs) - Comprehensive documentation

## Authentication Methods

The SDK supports four authentication methods:

### 1. Private Seed
Direct seed input - simplest method for development and CLI tools.

```typescript
import { createSeedSession } from '@nouslabs/sdk';

const session = await createSeedSession({
  seed: 'your-55-character-seed-here',
  label: 'My Account'
});
```

### 2. Vault File
Encrypted JSON files with password protection - recommended for desktop applications.

```typescript
import { createVaultSession } from '@nouslabs/sdk';

const session = await createVaultSession({
  file: vaultFile,
  password: 'secure-password'
});
```

### 3. MetaMask Snap
Browser extension with BIP44 key derivation and hardware wallet support.

```typescript
import { createMetaMaskSession } from '@nouslabs/sdk';

const session = await createMetaMaskSession({
  accountIdx: 0
});
```

### 4. WalletConnect
Mobile wallet connection via QR code.

```typescript
import { connectWalletConnect } from '@nouslabs/sdk';

const connection = await connectWalletConnect({
  projectId: 'YOUR_PROJECT_ID',
  metadata: {
    name: 'My Qubic App',
    description: 'Qubic Application',
    url: 'https://myapp.com',
    icons: ['https://myapp.com/icon.png']
  }
});

const session = await connection.waitForApproval();
```

## React Hooks

Complete React integration with hooks and providers:

```typescript
import {
  QubicAuthProvider,
  useQubicAuth,
  useQubicAccount,
  useIsAuthenticated,
  useAuthMethods,
  useAccountCreation
} from '@nouslabs/sdk/react';

// Main auth hook
const {
  connectWithMetaMask,
  connectWithVault,
  connectWithSeed,
  connectWithWalletConnect,
  disconnect,
  signTransaction,
  isConnected,
  account
} = useQubicAuth();

// Convenience hooks
const account = useQubicAccount();
const isAuthenticated = useIsAuthenticated();
const { hasMetaMask, hasVault } = useAuthMethods();
const { createNewAccount } = useAccountCreation();
```

## API Clients

Three specialized clients for different use cases:

### QubicLiveClient
Real-time network data and transaction broadcasting.

```typescript
const { live } = qubic;

await live.getTickInfo();
await live.getBalance(identity);
await live.broadcast(signedTransaction);
```

### QueryClient
Historical data with advanced filtering and pagination.

```typescript
const { query } = qubic;

await query.getTransactionsForIdentity(identity, options);
await query.getTickData(tickNumber);
```

### ArchiveClient
Legacy archive API access.

```typescript
const { archive } = qubic;

await archive.getLatestTick();
await archive.getTransaction(txId);
```

## TypeScript Support

Full TypeScript definitions with strict mode support:

```typescript
import type {
  Transaction,
  Balance,
  TickInfo,
  AuthSession,
  AuthAccount
} from '@nouslabs/sdk';

const processTransaction = (tx: Transaction) => {
  console.log(tx.source);       // string
  console.log(tx.destination);  // string
  console.log(tx.amount);       // number
  console.log(tx.status);       // TransactionStatus
};
```

## Examples

Check out our [examples repository](https://github.com/nous-labs/examples) for complete working examples:

- Balance checker
- Transaction sender
- Smart contract interaction
- React authentication demo
- Next.js application
- Real-time tick monitor

## Browser Compatibility

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

Requires ES2022, Fetch API, Web Crypto API, and BigInt support.

## Node.js Compatibility

- Node.js 18+
- Bun 1.0+
- Deno (with npm: specifier)

## Development

This is a monorepo managed with Bun workspaces.

### Install Dependencies

```bash
bun install
```

### Run Tests

```bash
bun test
```

### Build All Packages

```bash
bun run build
```

### Type Check

```bash
bun run typecheck
```

### Run CLI in Development

```bash
cd packages/cli
bun run dev
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- Report bugs via [GitHub Issues](https://github.com/nous-labs/sdk/issues)
- Discuss ideas in [GitHub Discussions](https://github.com/nous-labs/sdk/discussions)
- Submit pull requests for improvements

## Community

- **GitHub**: [nous-labs/sdk](https://github.com/nous-labs/sdk)
- **Discord**: [Join Qubic community](https://discord.gg/qubic)
- **Twitter**: [@nous_labs](https://twitter.com/nous_labs)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built for the Qubic blockchain community.

Special thanks to all contributors and the Qubic core team.

---

**Nous Labs** - Developer tools for Qubic blockchain  
[Website](https://nous-labs.com) • [SDK](./packages/sdk) • [CLI](./packages/cli) • [Documentation](./docs)