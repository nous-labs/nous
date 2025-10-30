# React Query Integration for Qubic TypeScript SDK

Type-safe React hooks for Qubic blockchain data fetching powered by [@tanstack/react-query](https://tanstack.com/query).

## Overview

This submodule provides a complete React Query integration for the Qubic TypeScript SDK, offering:

- **Ready-made hooks** for all Qubic blockchain operations
- **Automatic caching** and background refetching
- **Request deduplication** for concurrent requests
-  **Optimistic updates** for mutations
- **Real-time polling** utilities
- **Full TypeScript** support
- **100% test coverage**

## Installation

```bash
npm install @nvlabs/qts @tanstack/react-query react
```

## Quick Start

### 1. Setup Provider

```tsx
import { QubicQueryProvider } from '@nvlabs/qts/react/query';

function App() {
  return (
    <QubicQueryProvider>
      <YourApp />
    </QubicQueryProvider>
  );
}
```

### 2. Use Hooks

```tsx
import { useCurrentTick, useBalance } from '@nvlabs/qts/react/query';

function Dashboard({ address }) {
  const { data: tick, isLoading } = useCurrentTick();
  const { data: balance } = useBalance(address);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Tick: {tick?.tickInfo.tick}</h1>
      <p>Balance: {balance?.balance.balance} QUBIC</p>
    </div>
  );
}
```

## Available Hooks

### Live Client Hooks
- `useCurrentTick()` - Current tick information with 1s stale time
- `useTick(tickNumber)` - Specific tick data (uses QueryClient)
- `useBalance(address)` - Account balance with 5s stale time
- `useTransaction(txId)` - Transaction details
- `useQuorumTickData(tickNumber?)` - Quorum tick data
- `useComputorList(epoch?)` - Computor list
- `useHealthCheck()` - Network health status

### Query Client Hooks
- `useEntity(address)` - Entity information and stats

### Archive Client Hooks
- `useArchivedTick(tickNumber)` - Historical tick data
- `useArchivedTransaction(txId)` - Historical transaction

### Mutation Hooks
- `useBroadcastTransaction()` - Broadcast signed transaction

### Polling Utilities
- `useTickPoller(intervalMs)` - Poll current tick at interval
- `useBalancePoller(address, intervalMs)` - Poll balance at interval

## Key Features

### Fetch Context Binding Fix

This integration fixes the common "Illegal invocation" error when using fetch in browsers:

```typescript
// ✅ Fixed in base-client.ts
this.fetchFn = config.fetchFn ?? fetch.bind(globalThis);
```

The issue occurs when storing `fetch` as a property and calling it later without proper `this` binding. This integration ensures all fetch calls work correctly in browser environments.

### Optimized Stale Times

Different data types have appropriate stale times:
- Current tick: 1 second (frequently changing)
- Balance: 5 seconds (moderate changes)
- Historical data: Infinity (immutable)

### Cache Management

Use standardized query keys for manual cache operations:

```tsx
import { qubicQueryKeys } from '@nvlabs/qts/react/query';
import { useQueryClient } from '@tanstack/react-query';

function RefreshButton() {
  const queryClient = useQueryClient();

  return (
    <button onClick={() =>
      queryClient.invalidateQueries({ queryKey: qubicQueryKeys.live() })
    }>
      Refresh All Live Data
    </button>
  );
}
```

## Testing

All hooks are fully tested with 100% coverage:

```bash
bun test test/react-query.test.ts
```

**Test Results:**
- 24/24 tests passing
- 83 expect() calls
- Coverage includes all hooks, providers, and error handling

## Documentation

- **Full Documentation:** `/docs/content/docs/integrations/react-query.mdx`
- **Examples:** `/examples/react-query-demo.tsx`
- **Main Docs:** See the docs app at `/docs`

## Example Usage

See `/examples/react-query-demo.tsx` for comprehensive examples including:
- Real-time tick monitoring
- Balance checking with manual refresh
- Transaction history lookup
- Live dashboard with polling
- Cache management
- Transaction broadcasting

## Architecture

```
src/react/query/
├── hooks.ts         # All React Query hooks
├── provider.tsx     # QubicQueryProvider component
├── index.ts         # Public exports
└── README.md        # This file
```

## Best Practices

1. **Conditional Fetching** - Only fetch when data is valid
2. **Appropriate Polling** - Use 5-10 second intervals, not 100ms
3. **Error Handling** - Always handle loading and error states
4. **Cache Invalidation** - Invalidate after mutations
5. **TypeScript** - Leverage full type safety

## Contributing

This is a submodule of [@nvlabs/qts](https://github.com/nvlabs/qts). See the main repository for contribution guidelines.

## License

MIT License - see LICENSE file in the root directory.
