# Nous SDK

> νοῦς (nous) - mind, intellect, reason

[![npm version](https://img.shields.io/npm/v/@nouslabs/sdk.svg)](https://www.npmjs.com/package/@nouslabs/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

Intelligent tools for the Qubic blockchain. Build powerful applications with full type safety, modern async/await patterns, and universal compatibility.

**Developed by [Nous Labs](https://github.com/nous-labs)**

## What's New in v1.4.0

- **Unified Authentication System** - MetaMask Snap, Vault files, private seeds, and WalletConnect
- **React Hooks** - Complete authentication state management with `useQubicAuth()`
- **Account Creation** - Cryptographically secure account generation
- **Improved Documentation** - Clear, linear learning path

## Features

- **Four Authentication Methods** - MetaMask, Vault files, private seeds, WalletConnect
- **Full TypeScript Support** - Complete type definitions with strict mode
- **Universal Compatibility** - Works in browsers, Node.js, Bun, and Deno
- **Tree-Shakeable** - Import only what you need
- **Smart Contract Support** - Simplified querying with encoding/decoding utilities
- **React Integration** - First-class React support with hooks and providers
- **Modern APIs** - Clean async/await interfaces
- **Comprehensive Error Handling** - Typed errors with detailed messages
- **Well Documented** - Extensive documentation with working examples

## Installation

```bash
npm install @nouslabs/sdk
```

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

## CLI Tool

For command-line usage, check out our CLI:

```bash
npm install -g @nouslabs/cli

nous auth login
nous balance <identity>
nous send <to> <amount>
```

See [@nouslabs/cli documentation](https://github.com/nous-labs/cli) for more details.

## Documentation

Comprehensive documentation is available at our documentation site:

- [Getting Started](https://github.com/nous-labs/sdk/tree/main/docs)
- [Authentication Guide](https://github.com/nous-labs/sdk/tree/main/docs#authentication)
- [API Reference](https://github.com/nous-labs/sdk/tree/main/docs#api-reference)
- [Examples](https://github.com/nous-labs/sdk/tree/main/docs#examples)

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

## Migration from fwyk

If you're upgrading from `fwyk`, see our [Migration Guide](MIGRATION.md).

Quick migration:

```bash
npm uninstall fwyk
npm install @nouslabs/sdk
```

Update imports:
```typescript
// Before
import { createQubicClient } from 'fwyk';

// After
import { createQubicClient } from '@nouslabs/sdk';
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

**Nous Labs** - Intelligent tools for Qubic blockchain  
[Website](https://nouslabs.dev) • [Documentation](https://github.com/nous-labs/sdk/tree/main/docs) • [CLI](https://github.com/nous-labs/cli)