# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-01-01

### Added

#### Core Clients
- **QubicLiveClient** - Real-time network data access
  - Tick information queries
  - Balance operations
  - Asset management (issued, owned, possessed)
  - Smart contract querying
  - Transaction broadcasting
- **QueryClient** - Advanced historical data querying
  - Last processed tick retrieval
  - Processed tick intervals
  - Transaction history with filters and pagination
  - Computors list per epoch
  - Transaction lookup by hash
- **ArchiveClient** - Legacy archive API support
  - Historical transaction data
  - Tick data retrieval
  - Computors information

#### Type System
- Complete TypeScript definitions for all API endpoints
- Comprehensive type coverage for requests and responses
- Type-safe error handling with `QubicApiError`
- Shared types: `Transaction`, `Balance`, `TickInfo`, `AssetIssuance`, etc.
- Response types for all client methods

#### Utilities
- **Encoding utilities** (`encoding.ts`)
  - Hex ↔ Base64 ↔ Bytes conversions
  - UTF-8 string encoding/decoding
  - Little-endian integer encoding/decoding (8/16/32/64-bit)
  - Hex string manipulation (padding, concatenation, slicing)
  - Validation functions for hex and base64
- **Smart contract utilities** (`smart-contract.ts`)
  - `SmartContractQuery` builder for constructing contract requests
  - `SmartContractResponse` parser for decoding contract responses
  - Known contract constants (`QUBIC_CONTRACTS`)
  - Convenience functions for common contracts (QX, QUTIL, QUOTTERY, RANDOM)

#### Features
- Universal compatibility (Browser, Node.js, Bun, Deno)
- Zero runtime dependencies
- Tree-shakeable exports
- Configurable timeouts and headers
- Custom fetch implementation support
- Comprehensive error handling
- Automatic request/response validation

#### Documentation
- Comprehensive README with usage examples
- Architecture documentation (ARCHITECTURE.md)
- Contributing guidelines (CONTRIBUTING.md)
- API documentation with JSDoc comments
- Example code for common use cases

#### Testing
- Unit tests for encoding utilities
- Unit tests for smart contract builders and parsers
- Client initialization tests
- Integration test stubs for live API testing
- Type safety validation

#### Examples
- Basic usage examples
- Balance queries
- Smart contract interactions
- Transaction history retrieval
- Asset management
- Tick monitoring
- Error handling patterns

### Developer Experience
- Full TypeScript support with strict mode
- IDE autocomplete for all APIs
- Inline documentation
- Type-safe error handling
- Fluent builder APIs
- Sensible defaults

## Migration Guide

### From Direct API Calls

If you were previously making direct HTTP requests to Qubic APIs:

```typescript
// Before
const response = await fetch('https://rpc.qubic.org/v1/tick-info');
const data = await response.json();

// After
import { QubicLiveClient } from '@qubic/qts';
const client = new QubicLiveClient();
const { tickInfo } = await client.getTickInfo();
```

### From Archive API to Query API

Many Archive API endpoints are deprecated. Use Query API instead:

```typescript
// Deprecated
const tx = await archive.getTransaction(txId);

// Recommended
const tx = await query.getTransactionByHash(txId);
```

## Known Issues

None at this time.

## Deprecation Notices

The following Archive API methods are deprecated and will be removed in v2.0.0:
- `getLatestTick()` - Use `QueryClient.getLastProcessedTick()` or `QubicLiveClient.getTickInfo()`
- `getStatus()` - Use `QueryClient.getProcessedTickIntervals()`
- `getComputors()` - Use `QueryClient.getComputorsListForEpoch()`
- `getTransaction()` - Use `QueryClient.getTransactionByHash()`
- `getTickTransactions()` - Use `QueryClient.getTransactionsForTick()`
- `getTransferTransactionsPerTick()` - Use `QueryClient.getTransactionsForIdentity()`

Please migrate to the recommended alternatives.

## Roadmap

Planned for future releases:

### v1.1.0
- WebSocket support for real-time updates
- Automatic retry logic with exponential backoff
- Request caching layer
- Transaction builder utilities

### v1.2.0
- Wallet integration helpers
- Key management utilities
- HD wallet support
- Multi-signature support

### v2.0.0
- Remove deprecated Archive API methods
- Breaking changes to improve API consistency
- Performance optimizations
- Enhanced error messages

## Support

- **Issues**: https://github.com/qubic/qts/issues
- **Discussions**: https://github.com/qubic/qts/discussions
- **Discord**: https://discord.gg/qubic

## Contributors

Thank you to all contributors who helped make this release possible!

---

[Unreleased]: https://github.com/qubic/qts/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/qubic/qts/releases/tag/v1.0.0