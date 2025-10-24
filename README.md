# Qubic TypeScript SDK (QTS)

[![npm version](https://img.shields.io/npm/v/@nvlabs/qts.svg)](https://www.npmjs.com/package/@nvlabs/qts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

A comprehensive TypeScript/JavaScript library for integrating with the Qubic blockchain. Designed for both frontend and backend applications with full type safety and modern async/await patterns.

## Features

-  **Full TypeScript Support** - Complete type definitions for all API endpoints
-  **Modern Async/Await** - Clean promise-based API
-  **Universal** - Works in browsers, Node.js, Bun, and Deno
-  **Tree-shakeable** - Import only what you need
-  **Smart Contract Support** - Simplified smart contract querying with encoding/decoding utilities
-  **Three API Clients** - Live data, Archive data, and Query services
-  **Error Handling** - Comprehensive error types and handling
-  **Well Documented** - Extensive JSDoc comments and examples

## Installation

```bash
# Using npm
npm install @nvlabs/qts

# Using yarn
yarn add @nvlabs/qts

# Using bun
bun add @nvlabs/qts

# Using pnpm
pnpm add @nvlabs/qts
```

## Quick Start

### Basic Usage

```typescript
import { createQubicClient } from '@nvlabs/qts';

// Create a client instance with all services
const qubic = createQubicClient();

// Get current tick information
const tickInfo = await qubic.live.getTickInfo();
console.log('Current tick:', tickInfo.tickInfo.tick);

// Get balance for an identity
const balance = await qubic.live.getBalance('BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA');
console.log('Balance:', balance.balance.balance);
```

### Query Smart Contracts

```typescript
import { QubicLiveClient, createQuery, parseResponse } from '@nvlabs/qts';

const client = new QubicLiveClient();

// Build a smart contract query
const query = createQuery(4, 1) // Contract index 4 (QX), input type 1
  .addInt32(100)
  .addInt64(1000n);

// Execute the query
const response = await query.execute(client);

// Parse the response
const parser = parseResponse(response.responseData);
const value = parser.readInt64();
console.log('Contract response:', value);
```

### Get Transaction History

```typescript
import { QueryClient } from '@nvlabs/qts';

const query = new QueryClient();

// Get transactions for an identity
const result = await query.getTransactionsForIdentity(
  'BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA',
  {
    pagination: { offset: 0, size: 20 },
    ranges: {
      tickNumber: {
        gte: '15000000',
        lte: '15100000'
      }
    }
  }
);

console.log('Transactions:', result.transactions);
```

## API Clients

### QubicLiveClient

Real-time access to Qubic network state.

```typescript
import { QubicLiveClient } from '@nvlabs/qts';

const client = new QubicLiveClient({
  baseUrl: 'https://rpc.qubic.org', // optional, this is default
  timeout: 30000, // optional, 30s default
});

// Tick Information
const tickInfo = await client.getTickInfo();
const blockHeight = await client.getBlockHeight(); // deprecated

// Balance Operations
const balance = await client.getBalance('IDENTITY_ADDRESS');

// Asset Operations
const issuedAssets = await client.getIssuedAssets('IDENTITY_ADDRESS');
const ownedAssets = await client.getOwnedAssets('IDENTITY_ADDRESS');
const possessedAssets = await client.getPossessedAssets('IDENTITY_ADDRESS');

// Asset Filtering
const assets = await client.getIssuedAssetsByFilter({
  issuerIdentity: 'IDENTITY_ADDRESS',
  assetName: 'ASSET_NAME'
});

// Smart Contract Queries
const contractResponse = await client.querySmartContract({
  contractIndex: 4,
  inputType: 1,
  inputSize: 32,
  requestData: 'base64EncodedData'
});

// Simplified contract query
const response = await client.queryContract(4, 1, 'hexOrBase64Data');

// Broadcast Transactions
const result = await client.broadcastTransaction({
  encodedTransaction: 'encodedTxData'
});
```

### ArchiveClient

Access to historical network data (note: many methods are deprecated in favor of QueryClient).

```typescript
import { ArchiveClient } from '@nvlabs/qts';

const archive = new ArchiveClient();

// Transaction Operations
const transaction = await archive.getTransactionV2('TX_ID');
const tickTransactions = await archive.getTickTransactionsV2(15000000);

// Identity Transactions
const transfers = await archive.getIdentityTransfersInTickRangeV2(
  'IDENTITY_ADDRESS',
  {
    startTick: 15000000,
    endTick: 15100000,
    page: 1,
    pageSize: 50
  }
);

// Tick Data
const tickData = await archive.getTickData(15000000);

// Computors
const computors = await archive.getComputors(100);
```

### QueryClient

Advanced querying capabilities with modern API (recommended for historical data).

```typescript
import { QueryClient } from '@nvlabs/qts';

const query = new QueryClient({
  baseUrl: 'https://api.qubic.org', // optional, this is default
});

// Last Processed Tick
const lastTick = await query.getLastProcessedTick();
console.log('Last processed tick:', lastTick.tickNumber);

// Processed Tick Intervals
const intervals = await query.getProcessedTickIntervals();

// Tick Data
const tickData = await query.getTickData(15000000);

// Computors for Epoch
const computors = await query.getComputorsListForEpoch(100);

// Transaction by Hash
const transaction = await query.getTransactionByHash('TX_HASH');

// Transactions for Tick
const transactions = await query.getTransactionsForTick(15000000);

// Transactions for Identity with Filtering
const result = await query.getTransactionsForIdentity('IDENTITY_ADDRESS', {
  filters: {
    moneyFlew: 'true'
  },
  ranges: {
    tickNumber: {
      gte: '15000000',
      lte: '15100000'
    }
  },
  pagination: {
    offset: 0,
    size: 50
  }
});

// Simplified pagination
const paginated = await query.getTransactionsForIdentityPaginated(
  'IDENTITY_ADDRESS',
  0, // offset
  20  // size
);

// Transactions in tick range
const ranged = await query.getTransactionsForIdentityInRange(
  'IDENTITY_ADDRESS',
  15000000, // start tick
  15100000  // end tick
);
```

## Smart Contract Utilities

### Building Contract Queries

```typescript
import { SmartContractQuery, QubicLiveClient } from '@nvlabs/qts';

const client = new QubicLiveClient();

// Create a query builder
const query = new SmartContractQuery(4, 1); // QX contract, input type 1

// Build the query data
query
  .addByte(0x01)
  .addInt16(256)
  .addInt32(100000)
  .addInt64(1000000000n)
  .addString('Hello', 32) // 32-byte padded string
  .addHex('deadbeef')
  .addPadding(16); // Add 16 zero bytes

// Execute
const response = await query.execute(client);
```

### Parsing Contract Responses

```typescript
import { SmartContractResponse, parseResponse } from '@nvlabs/qts';

// Parse a response
const parser = parseResponse(response.responseData);

// Read different data types
const byte = parser.readByte();
const int16 = parser.readInt16();
const int32 = parser.readInt32();
const int64 = parser.readInt64();
const text = parser.readString(32);
const identity = parser.readIdentity(); // 60-byte identity
const hex = parser.readHex(16);

// Check remaining data
if (parser.hasMore()) {
  const remaining = parser.readRemaining();
}

// Manual offset control
parser.setOffset(0);
parser.skip(8);
```

### Known Contract Indices

```typescript
import { QUBIC_CONTRACTS, queryQX, queryQutil } from '@nvlabs/qts';

// All available contracts (based on https://github.com/qubic/core)
console.log(QUBIC_CONTRACTS.QX);              // 1  - Decentralized exchange
console.log(QUBIC_CONTRACTS.QUOTTERY);        // 2  - Betting platform
console.log(QUBIC_CONTRACTS.RANDOM);          // 3  - Random number generator
console.log(QUBIC_CONTRACTS.QUTIL);           // 4  - Utility functions
console.log(QUBIC_CONTRACTS.MYLASTMATCH);     // 5  - My Last Match
console.log(QUBIC_CONTRACTS.GQMP);            // 6  - General Quorum Proposal
console.log(QUBIC_CONTRACTS.QBAY);            // 7  - Marketplace
console.log(QUBIC_CONTRACTS.QDRAW);           // 8  - Drawing/lottery
console.log(QUBIC_CONTRACTS.QEARN);           // 9  - Earning platform
console.log(QUBIC_CONTRACTS.QSWAP);           // 10 - Token swap
console.log(QUBIC_CONTRACTS.QVAULT);          // 11 - Vault contract
console.log(QUBIC_CONTRACTS.QBOND);           // 12 - Bond contract
console.log(QUBIC_CONTRACTS.MSVAULT);         // 13 - Multi-signature vault
console.log(QUBIC_CONTRACTS.NOSTROMO);        // 14 - Nostromo
console.log(QUBIC_CONTRACTS.RANDOMLOTTERY);   // 15 - Random lottery
console.log(QUBIC_CONTRACTS.SUPPLYWATCHER);   // 16 - Supply monitoring
console.log(QUBIC_CONTRACTS.CCF);             // 17 - Computor Controlled Fund

// Convenience functions for each contract
const qxResponse = await queryQX(client, 1, 'requestData');
const qutilResponse = await queryQutil(client, 2, 'requestData');
const qearnResponse = await queryQearn(client, 1, 'requestData');
const qswapResponse = await queryQswap(client, 1, 'requestData');
// ... and more (see API documentation)
```

## Encoding/Decoding Utilities

```typescript
import {
  hexToBase64,
  base64ToHex,
  bytesToHex,
  hexToBytes,
  stringToHex,
  hexToString,
  encodeInt64LE,
  decodeInt64LE,
  encodeInt32LE,
  decodeInt32LE,
  padHex,
  concatHex,
  sliceHex,
} from '@nvlabs/qts';

// Hex/Base64 conversions
const base64 = hexToBase64('deadbeef');
const hex = base64ToHex(base64);

// String conversions
const hexStr = stringToHex('Hello World');
const str = hexToString(hexStr);

// Integer encoding (little-endian)
const int64Hex = encodeInt64LE(1234567890n);
const int64Val = decodeInt64LE(int64Hex);

const int32Hex = encodeInt32LE(12345);
const int32Val = decodeInt32LE(int32Hex);

// Hex manipulation
const padded = padHex('ff', 8); // '000000ff' (8 bytes)
const combined = concatHex('dead', 'beef'); // 'deadbeef'
const sliced = sliceHex('deadbeef', 1, 3); // 'adbe' (bytes 1-3)
```

## Error Handling

```typescript
import { QubicLiveClient, type QubicApiError } from '@nvlabs/qts';

const client = new QubicLiveClient();

try {
  const balance = await client.getBalance('INVALID_IDENTITY');
} catch (error) {
  const apiError = error as QubicApiError;
  
  console.error('Error:', apiError.message);
  console.error('Status:', apiError.status);
  console.error('Details:', apiError.details);
  
  if (apiError.status === 404) {
    console.error('Identity not found');
  } else if (apiError.status === 408) {
    console.error('Request timeout');
  } else if (apiError.status === 0) {
    console.error('Network error');
  }
}
```

## Configuration

### Custom Base URLs

```typescript
import { createQubicClient } from '@nvlabs/qts';

const qubic = createQubicClient({
  liveUrl: 'https://custom-rpc.qubic.org',
  archiveUrl: 'https://custom-archive.qubic.org',
  queryUrl: 'https://custom-api.qubic.org',
  timeout: 60000, // 60 seconds
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

### Individual Clients

```typescript
import { QubicLiveClient, QueryClient } from '@nvlabs/qts';

const live = new QubicLiveClient({
  baseUrl: 'https://rpc.qubic.org',
  timeout: 30000,
  headers: { 'Authorization': 'Bearer token' }
});

const query = new QueryClient({
  baseUrl: 'https://api.qubic.org',
  timeout: 45000
});
```

### Runtime Configuration

```typescript
const client = new QubicLiveClient();

// Update base URL
client.setBaseUrl('https://new-rpc.qubic.org');

// Update headers
client.setHeaders({
  'X-API-Key': 'new-key'
});

// Update timeout
client.setTimeout(60000);
```

## TypeScript Support

Full TypeScript support with complete type definitions:

```typescript
import type {
  Transaction,
  Balance,
  TickInfo,
  AssetIssuance,
  QuerySmartContractRequest,
  QuerySmartContractResponse,
  GetBalanceResponse,
  GetTickInfoResponse,
} from '@nvlabs/qts';

// All types are fully typed
const processTransaction = (tx: Transaction): void => {
  console.log(`From: ${tx.source}`);
  console.log(`To: ${tx.destination}`);
  console.log(`Amount: ${tx.amount}`);
  console.log(`Tick: ${tx.tickNumber}`);
};

// Response types
const handleBalance = (response: GetBalanceResponse): void => {
  const { balance, validForTick } = response.balance;
  console.log(`Balance: ${balance} at tick ${validForTick}`);
};
```

## Examples

### Monitor New Ticks

```typescript
import { QubicLiveClient } from '@nvlabs/qts';

const client = new QubicLiveClient();

async function monitorTicks() {
  let lastTick = 0;
  
  while (true) {
    try {
      const { tickInfo } = await client.getTickInfo();
      
      if (tickInfo.tick > lastTick) {
        console.log(`New tick: ${tickInfo.tick}`);
        lastTick = tickInfo.tick;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error fetching tick:', error);
    }
  }
}

monitorTicks();
```

### Get All Transactions for Identity

```typescript
import { QueryClient } from '@nvlabs/qts';

async function getAllTransactions(identity: string) {
  const query = new QueryClient();
  const allTransactions = [];
  let offset = 0;
  const pageSize = 100;
  
  while (true) {
    const result = await query.getTransactionsForIdentityPaginated(
      identity,
      offset,
      pageSize
    );
    
    allTransactions.push(...result.transactions);
    
    if (result.transactions.length < pageSize) {
      break; // No more results
    }
    
    offset += pageSize;
  }
  
  return allTransactions;
}

const txs = await getAllTransactions('IDENTITY_ADDRESS');
console.log(`Total transactions: ${txs.length}`);
```

### Query QX Exchange Orders

```typescript
import { QubicLiveClient, createQuery, parseResponse, QUBIC_CONTRACTS } from '@nvlabs/qts';

const client = new QubicLiveClient();

// Query QX for order book (example - adjust based on actual QX contract spec)
const query = createQuery(QUBIC_CONTRACTS.QX, 5) // QX contract (index 1), input type 5
  .addInt32(0); // Asset pair ID

const response = await query.execute(client);
const parser = parseResponse(response.responseData);

// Parse order book response
const orderCount = parser.readInt32();
console.log(`Orders: ${orderCount}`);

for (let i = 0; i < orderCount; i++) {
  const price = parser.readInt64();
  const quantity = parser.readInt64();
  console.log(`Price: ${price}, Quantity: ${quantity}`);
}
```

### Query Qearn Staking Contract

```typescript
import { queryQearn, parseResponse, QUBIC_CONTRACTS } from '@nvlabs/qts';

const client = new QubicLiveClient();

// Query Qearn staking information
const response = await queryQearn(client, 1, 'hexEncodedData');
const parser = parseResponse(response.responseData);

// Parse staking info based on contract specification
const stakedAmount = parser.readInt64();
console.log(`Staked: ${stakedAmount}`);
```

### Query Quottery Betting Platform

```typescript
import { queryQuottery, QUBIC_CONTRACTS } from '@nvlabs/qts';

const client = new QubicLiveClient();

// Query Quottery for betting information
const response = await queryQuottery(client, 2, 'requestData');
console.log('Bet data:', response.responseData);
```

## Browser Usage

The library works seamlessly in browsers:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Qubic Browser Example</title>
</head>
<body>
  <script type="module">
    import { createQubicClient } from 'https://esm.sh/@nvlabs/qts';
    
    const qubic = createQubicClient();
    
    async function displayBalance() {
      const response = await qubic.live.getBalance('IDENTITY_ADDRESS');
      document.getElementById('balance').textContent = response.balance.balance;
    }
    
    displayBalance();
  </script>
  
  <div>Balance: <span id="balance">Loading...</span></div>
</body>
</html>
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Resources

- [Qubic Official Website](https://qubic.org)
- [Qubic Documentation](https://qubic.github.io/integration/)
- [API Swagger Specs](https://qubic.github.io/integration/Partners/swagger/)

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/qubic/qts/issues)
- Join the [Qubic Discord](https://discord.gg/qubic)

---

Built with for the Qubic community