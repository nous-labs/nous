# Qubic TypeScript SDK (QTS)

[![npm version](https://img.shields.io/npm/v/@nvlabs/qts.svg)](https://www.npmjs.com/package/@nvlabs/qts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

A comprehensive TypeScript/JavaScript SDK for the Qubic blockchain. Build powerful applications with full type safety, modern async/await patterns, and universal compatibility.

## Features

- **Full TypeScript Support** - Complete type definitions with strict mode
- **Universal** - Works in browsers, Node.js, Bun, and Deno
- **Tree-shakeable** - Import only what you need
- **Smart Contract Support** - Simplified querying with encoding/decoding utilities
- **Wallet Integrations** - Helpers for injected wallets and WalletConnect (Sign v2)
- **Modern APIs** - Clean async/await interfaces
- **Error Handling** - Comprehensive error types and messages
- **Well Documented** - Extensive docs with examples

## Installation

```bash
npm install @nvlabs/qts
```

## Quick Start

```typescript
import { createQubicClient } from '@nvlabs/qts';

// Create client
const qubic = createQubicClient();

// Get current tick
const { tickInfo } = await qubic.live.getTickInfo();
console.log(`Current tick: ${tickInfo.tick}`);

// Check balance
const { balance } = await qubic.live.getBalance('YOUR_IDENTITY_HERE');
console.log(`Balance: ${balance.balance}`);

// Get transaction history
const { transactions } = await qubic.query.getTransactionsForIdentity(
  'YOUR_IDENTITY_HERE',
  { pagination: { offset: 0, size: 10 } }
);
```

### Smart Contract Querying

```typescript
import { createQuery, parseResponse, QUBIC_CONTRACTS } from '@nvlabs/qts';

// Build query
const query = createQuery(QUBIC_CONTRACTS.QX, 1)
  .addInt32(100)
  .addInt64(1000n);

// Execute and parse
const response = await query.execute(qubic.live);
const parser = parseResponse(response.responseData);
const result = parser.readInt64();
```

## Documentation

Comprehensive documentation is available at [/docs](./docs):

- **[Getting Started](./docs/content/docs/index.mdx)** - Installation and basic usage
- **[API Clients](./docs/content/docs/api-clients.mdx)** - Complete API reference
- **[Smart Contracts](./docs/content/docs/smart-contracts.mdx)** - Contract querying guide
- **[Architecture](./docs/content/docs/architecture.mdx)** - Design patterns and internals

## Key Concepts

### Three API Clients

- **QubicLiveClient** - Real-time network data, balances, smart contracts
- **QueryClient** - Historical transactions, analytics, advanced queries
- **ArchiveClient** - Legacy archive access (deprecated methods)

### Smart Contract Support

All major Qubic contracts supported:
- QX (Exchange)
- Qearn (Staking)
- Qswap (Token Swap)
- QUtil (Utilities)
- And more...

## Examples

### Monitor Ticks

```typescript
let lastTick = 0;
setInterval(async () => {
  const { tickInfo } = await qubic.live.getTickInfo();
  if (tickInfo.tick > lastTick) {
    console.log(`New tick: ${tickInfo.tick}`);
    lastTick = tickInfo.tick;
  }
}, 1000);
```

### Query Assets

```typescript
const [issued, owned, possessed] = await Promise.all([
  qubic.live.getIssuedAssets(identity),
  qubic.live.getOwnedAssets(identity),
  qubic.live.getPossessedAssets(identity)
]);
```

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Type checking
bun run typecheck

# Build
bun run build
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes using [conventional commits](https://www.conventionalcommits.org/)
4. Push to your branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Community & Support

- **GitHub Issues** - [Report bugs or request features](https://github.com/nvlabs/qts/issues)
- **GitHub Discussions** - [Ask questions and share ideas](https://github.com/nvlabs/qts/discussions)
- **Discord** - [Join the Qubic community](https://discord.gg/qubic)

## Resources

- [Qubic Website](https://qubic.org/)
- [Qubic Documentation](https://docs.qubic.org/)
- [Qubic Core Repository](https://github.com/qubic/core)
- [npm Package](https://www.npmjs.com/package/@nvlabs/qts)

## Project Stats

- **Version**: 1.0.0
- **Package**: @nvlabs/qts
- **Author**: nvlabs
- **Node**: >=18.0.0

---

**Built with love by the Qubic community**

[Get Started](./docs/content/docs/index.mdx) • [API Reference](./docs/content/docs/api-clients.mdx) • [Examples](./examples) • [Report Issue](https://github.com/nvlabs/qts/issues)
