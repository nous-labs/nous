# Qubic Smart Contracts Reference

Complete guide to querying Qubic smart contracts using the TypeScript SDK.

## Table of Contents

- [Overview](#overview)
- [Contract List](#contract-list)
- [Querying Contracts](#querying-contracts)
- [Contract Details](#contract-details)
- [Examples](#examples)

## Overview

Qubic smart contracts are deployed on the Qubic network and can be queried using the `querySmartContract` endpoint. Each contract has a unique index and supports various input types for different operations.

### Key Concepts

- **Contract Index**: Unique identifier for each contract (1-17+)
- **Input Type**: Function/procedure identifier within the contract
- **Request Data**: Encoded parameters for the contract function
- **Response Data**: Encoded return values from the contract

## Contract List

All contracts based on [qubic/core repository](https://github.com/qubic/core/tree/main/src/contracts):

| Index | Name | Constant | Description |
|-------|------|----------|-------------|
| 1 | Qx | `QUBIC_CONTRACTS.QX` | Decentralized exchange for trading assets |
| 2 | Quottery | `QUBIC_CONTRACTS.QUOTTERY` | Decentralized betting platform |
| 3 | Random | `QUBIC_CONTRACTS.RANDOM` | Random number generator |
| 4 | QUtil | `QUBIC_CONTRACTS.QUTIL` | Utility functions (SendToMany, etc.) |
| 5 | MyLastMatch | `QUBIC_CONTRACTS.MYLASTMATCH` | My Last Match game contract |
| 6 | GQMP | `QUBIC_CONTRACTS.GQMP` | General Quorum Proposal |
| 7 | Qbay | `QUBIC_CONTRACTS.QBAY` | Marketplace for buying/selling |
| 8 | Qdraw | `QUBIC_CONTRACTS.QDRAW` | Drawing/lottery system |
| 9 | Qearn | `QUBIC_CONTRACTS.QEARN` | Staking and earning platform |
| 10 | Qswap | `QUBIC_CONTRACTS.QSWAP` | Token swap functionality |
| 11 | Qvault | `QUBIC_CONTRACTS.QVAULT` | Asset vault storage |
| 12 | Qbond | `QUBIC_CONTRACTS.QBOND` | Bond contract |
| 13 | MsVault | `QUBIC_CONTRACTS.MSVAULT` | Multi-signature vault |
| 14 | Nostromo | `QUBIC_CONTRACTS.NOSTROMO` | Nostromo contract |
| 15 | RandomLottery | `QUBIC_CONTRACTS.RANDOMLOTTERY` | Random lottery system |
| 16 | SupplyWatcher | `QUBIC_CONTRACTS.SUPPLYWATCHER` | Supply monitoring contract |
| 17 | CCF | `QUBIC_CONTRACTS.CCF` | Computor Controlled Fund |

## Querying Contracts

### Method 1: Using Contract Constants

```typescript
import { QubicLiveClient, QUBIC_CONTRACTS, createQuery } from '@qubic/qts';

const client = new QubicLiveClient();

// Query QX contract
const query = createQuery(QUBIC_CONTRACTS.QX, 1)
  .addInt32(someValue)
  .addInt64(anotherValue);

const response = await query.execute(client);
```

### Method 2: Using Helper Functions

```typescript
import { queryQX, queryQearn, queryQuottery } from '@qubic/qts';

const client = new QubicLiveClient();

// Query QX
const qxResponse = await queryQX(client, inputType, requestData);

// Query Qearn
const qearnResponse = await queryQearn(client, inputType, requestData);

// Query Quottery
const quotteryResponse = await queryQuottery(client, inputType, requestData);
```

### Method 3: Direct Query

```typescript
const response = await client.querySmartContract({
  contractIndex: 1, // QX
  inputType: 1,
  inputSize: 32,
  requestData: 'base64EncodedData'
});
```

## Contract Details

### 1. QX - Decentralized Exchange

**Index**: 1 | **Helper**: `queryQX()`

Qubic's first decentralized exchange for trading assets.

**Features**:
- Asset trading
- Order book management
- Fee collection
- Shareholder revenue distribution

**Example**:
```typescript
import { QUBIC_CONTRACTS, createQuery, parseResponse } from '@qubic/qts';

// Query order book
const query = createQuery(QUBIC_CONTRACTS.QX, 5)
  .addInt32(assetPairId);

const response = await query.execute(client);
const parser = parseResponse(response.responseData);

// Parse orders
const orderCount = parser.readInt32();
for (let i = 0; i < orderCount; i++) {
  const price = parser.readInt64();
  const quantity = parser.readInt64();
  console.log(`Order: ${price} @ ${quantity}`);
}
```

**Resources**:
- [Qx Documentation](https://docs.qubic.org/learn/qx/)
- [Source Code](https://github.com/qubic/core/blob/main/src/contracts/Qx.h)

---

### 2. Quottery - Betting Platform

**Index**: 2 | **Helper**: `queryQuottery()`

Decentralized betting platform with oracle verification.

**Features**:
- Create betting events
- Place bets
- Oracle-verified outcomes
- Automated payouts

**Example**:
```typescript
import { queryQuottery, parseResponse } from '@qubic/qts';

// Query active bets
const response = await queryQuottery(client, 1, encodedRequest);
const parser = parseResponse(response.responseData);

const betCount = parser.readInt32();
console.log(`Active bets: ${betCount}`);
```

**Resources**:
- [Quottery Website](https://quottery.org/)
- [Source Code](https://github.com/qubic/core/blob/main/src/contracts/Quottery.h)

---

### 3. Random - Random Number Generator

**Index**: 3 | **Helper**: `queryRandom()`

Secure random number generation for the Qubic network.

**Features**:
- Cryptographically secure randomness
- Verifiable random numbers
- Used by other contracts

**Example**:
```typescript
import { queryRandom, parseResponse } from '@qubic/qts';

const response = await queryRandom(client, 1, '');
const parser = parseResponse(response.responseData);
const randomValue = parser.readInt64();
console.log(`Random: ${randomValue}`);
```

---

### 4. QUtil - Utility Functions

**Index**: 4 | **Helper**: `queryQutil()`

Provides utility functions for common operations.

**Features**:
- SendToMany (batch transfers)
- Burn QUBIC
- Benchmarking tools

**Example - SendToMany**:
```typescript
import { QUBIC_CONTRACTS, createQuery } from '@qubic/qts';

// Prepare batch transfer
const query = createQuery(QUBIC_CONTRACTS.QUTIL, 1); // SendToMany V1

// Add recipients (max 25)
for (const transfer of transfers) {
  query
    .addString(transfer.recipient, 60) // Identity (60 bytes)
    .addInt64(transfer.amount);
}

const response = await query.execute(client);
```

**Resources**:
- [Source Code](https://github.com/qubic/core/blob/main/src/contracts/QUtil.h)

---

### 9. Qearn - Staking Platform

**Index**: 9 | **Helper**: `queryQearn()`

Staking and earning platform for passive income.

**Features**:
- Lock QUBIC for rewards
- Flexible lock periods
- Automatic reward distribution
- Staking statistics

**Example**:
```typescript
import { queryQearn, parseResponse } from '@qubic/qts';

// Query staking info
const response = await queryQearn(client, 1, identityData);
const parser = parseResponse(response.responseData);

const stakedAmount = parser.readInt64();
const lockEndTick = parser.readInt32();
console.log(`Staked: ${stakedAmount}, Unlocks at tick: ${lockEndTick}`);
```

---

### 10. Qswap - Token Swap

**Index**: 10 | **Helper**: `queryQswap()`

Token swap functionality for asset exchanges.

**Features**:
- Asset swapping
- Liquidity pools
- Price discovery
- Slippage protection

**Example**:
```typescript
import { queryQswap, createQuery } from '@qubic/qts';

const query = createQuery(QUBIC_CONTRACTS.QSWAP, 1)
  .addInt32(fromAssetId)
  .addInt32(toAssetId)
  .addInt64(amount);

const response = await query.execute(client);
```

---

### 17. CCF - Computor Controlled Fund

**Index**: 17 | **Helper**: `queryCCF()`

Fund controlled by computors for ecosystem development.

**Features**:
- Proposal voting
- Fund distribution
- Transparent governance
- Community initiatives

**Example**:
```typescript
import { queryCCF, parseResponse } from '@qubic/qts';

// Query fund balance
const response = await queryCCF(client, 1, '');
const parser = parseResponse(response.responseData);
const balance = parser.readInt64();
console.log(`CCF Balance: ${balance}`);
```

---

## Examples

### Complete Contract Query Flow

```typescript
import {
  QubicLiveClient,
  QUBIC_CONTRACTS,
  createQuery,
  parseResponse,
  encodeInt32LE,
  hexToBase64
} from '@qubic/qts';

const client = new QubicLiveClient();

// Step 1: Build query
const query = createQuery(QUBIC_CONTRACTS.QX, 1)
  .addByte(0x01)
  .addInt32(100)
  .addInt64(1000n);

// Step 2: Execute query
const response = await query.execute(client);

// Step 3: Parse response
const parser = parseResponse(response.responseData);
const resultCode = parser.readByte();
const value = parser.readInt64();

console.log(`Result: ${resultCode}, Value: ${value}`);
```

### Query Multiple Contracts

```typescript
import {
  queryQX,
  queryQearn,
  queryQuottery,
  parseResponse
} from '@qubic/qts';

const client = new QubicLiveClient();

async function queryAllContracts() {
  // Query QX
  const qxResponse = await queryQX(client, 1, requestData);
  console.log('QX:', parseResponse(qxResponse.responseData).readInt64());

  // Query Qearn
  const qearnResponse = await queryQearn(client, 1, requestData);
  console.log('Qearn:', parseResponse(qearnResponse.responseData).readInt64());

  // Query Quottery
  const quotteryResponse = await queryQuottery(client, 1, requestData);
  console.log('Quottery:', parseResponse(quotteryResponse.responseData).readInt32());
}

queryAllContracts();
```

### Error Handling

```typescript
try {
  const response = await queryQX(client, 1, requestData);
  const parser = parseResponse(response.responseData);
  
  // Check for error code in response
  const errorCode = parser.readByte();
  if (errorCode !== 0) {
    console.error(`Contract error: ${errorCode}`);
    return;
  }
  
  // Process successful response
  const data = parser.readInt64();
  console.log('Success:', data);
  
} catch (error) {
  console.error('Query failed:', error.message);
}
```

### Building Complex Queries

```typescript
import { createQuery, QUBIC_CONTRACTS } from '@qubic/qts';

// Complex query with multiple parameters
const query = createQuery(QUBIC_CONTRACTS.QSWAP, 3)
  .addByte(0x01)                    // Operation type
  .addInt32(assetPairId)            // Asset pair
  .addInt64(amountIn)               // Input amount
  .addInt64(minAmountOut)           // Minimum output (slippage)
  .addString(recipient, 60)         // Recipient identity
  .addInt32(deadline)               // Deadline tick
  .addPadding(32);                  // Reserved bytes

const response = await query.execute(client);
```

## Best Practices

### 1. Request Data Encoding

Always use the provided encoding utilities:
```typescript
import { encodeInt64LE, hexToBase64, createQuery } from '@qubic/qts';

// ✓ Good - Use query builder
const query = createQuery(contractIndex, inputType)
  .addInt64(value);

// ✓ Good - Use encoding utilities
const hex = encodeInt64LE(value);
const base64 = hexToBase64(hex);
```

### 2. Response Data Parsing

Always validate response data:
```typescript
const parser = parseResponse(response.responseData);

// Check if there's data to read
if (!parser.hasMore()) {
  console.log('Empty response');
  return;
}

// Read expected data
const value = parser.readInt64();

// Check for remaining unexpected data
if (parser.hasMore()) {
  console.warn('Unexpected data remaining');
}
```

### 3. Error Handling

Always handle contract-specific errors:
```typescript
try {
  const response = await queryContract(...);
  const parser = parseResponse(response.responseData);
  
  // Many contracts return error codes
  const statusCode = parser.readByte();
  if (statusCode !== 0) {
    throw new Error(`Contract error: ${statusCode}`);
  }
  
  // Process success case
  
} catch (error) {
  if (error.status === 408) {
    console.log('Timeout - retry');
  } else {
    console.error('Contract query failed:', error);
  }
}
```

### 4. Input Type Discovery

To find available input types for a contract:
1. Check the contract source code in [qubic/core](https://github.com/qubic/core/tree/main/src/contracts)
2. Look for `REGISTER_USER_FUNCTIONS_AND_PROCEDURES` function
3. Each registered function/procedure has an input type

Example from QUtil.h:
```cpp
REGISTER_USER_FUNCTIONS_AND_PROCEDURES
    REGISTER_USER_PROCEDURE(SendToManyV1, 1);
    REGISTER_USER_PROCEDURE(BurnQubic, 2);
    // Input type 1 = SendToManyV1
    // Input type 2 = BurnQubic
REGISTER_USER_FUNCTIONS_AND_PROCEDURES_END
```

## Helper Functions

The SDK provides helper functions for all contracts:

```typescript
import {
  queryQX,           // Qx exchange
  queryQuottery,     // Quottery betting
  queryRandom,       // Random numbers
  queryQutil,        // Utility functions
  queryMyLastMatch,  // MyLastMatch
  queryGQMP,         // General Quorum Proposal
  queryQbay,         // Qbay marketplace
  queryQdraw,        // Qdraw lottery
  queryQearn,        // Qearn staking
  queryQswap,        // Qswap exchange
  queryQvault,       // Qvault storage
  queryQbond,        // Qbond
  queryMsVault,      // Multi-sig vault
  queryNostromo,     // Nostromo
  queryRandomLottery,// Random lottery
  querySupplyWatcher,// Supply monitoring
  queryCCF,          // Computor Controlled Fund
} from '@qubic/qts';
```

## Resources

- [Qubic Core Repository](https://github.com/qubic/core)
- [Contract Source Code](https://github.com/qubic/core/tree/main/src/contracts)
- [Qubic Documentation](https://docs.qubic.org/)
- [Qubic Discord](https://discord.gg/qubic)
- [SDK Documentation](README.md)

## Contributing

To add support for new contracts:

1. Add contract index to `QUBIC_CONTRACTS` constant
2. Create helper function `queryContractName()`
3. Export from `src/index.ts`
4. Add documentation to this file
5. Update tests
6. Submit pull request

---

**Last Updated**: 2024
**SDK Version**: 1.0.0+

For contract-specific questions, please refer to the contract source code or ask in the Qubic Discord community.