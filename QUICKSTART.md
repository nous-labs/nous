# Quick Start Guide

Get up and running with the Qubic TypeScript SDK in 5 minutes!

## Installation

```bash
npm install @qubic/qts
# or
bun add @qubic/qts
```

## Basic Setup

```typescript
import { createQubicClient } from '@qubic/qts';

// Create a client with all services
const qubic = createQubicClient();
```

## Common Tasks

### 1. Get Current Tick

```typescript
const { tickInfo } = await qubic.live.getTickInfo();
console.log(`Current tick: ${tickInfo.tick}`);
console.log(`Epoch: ${tickInfo.epoch}`);
```

### 2. Check Account Balance

```typescript
const identity = 'YOUR_QUBIC_IDENTITY_HERE';
const { balance } = await qubic.live.getBalance(identity);
console.log(`Balance: ${balance.balance}`);
```

### 3. Get Transaction History

```typescript
const { transactions } = await qubic.query.getTransactionsForIdentity(
  identity,
  {
    pagination: { offset: 0, size: 10 }
  }
);

transactions.forEach(tx => {
  console.log(`${tx.source} → ${tx.destination}: ${tx.amount}`);
});
```

### 4. Query a Smart Contract

```typescript
import { createQuery, parseResponse } from '@qubic/qts';

// Build the query
const query = createQuery(4, 1) // QX contract, input type 1
  .addInt32(0)
  .addInt64(1000n);

// Execute
const response = await query.execute(qubic.live);

// Parse response
const parser = parseResponse(response.responseData);
const result = parser.readInt64();
console.log(`Contract result: ${result}`);
```

### 5. Get Assets for an Identity

```typescript
// Issued assets
const issued = await qubic.live.getIssuedAssets(identity);
console.log(`Issued: ${issued.issuedAssets.length}`);

// Owned assets
const owned = await qubic.live.getOwnedAssets(identity);
console.log(`Owned: ${owned.ownedAssets.length}`);
```

### 6. Search Transactions by Tick Range

```typescript
const transactions = await qubic.query.getTransactionsForIdentityInRange(
  identity,
  15000000,  // start tick
  15100000   // end tick
);

console.log(`Found ${transactions.transactions.length} transactions`);
```

## Error Handling

Always wrap API calls in try-catch blocks:

```typescript
try {
  const balance = await qubic.live.getBalance(identity);
  console.log('Balance:', balance.balance.balance);
} catch (error) {
  if (error.status === 404) {
    console.log('Identity not found');
  } else if (error.status === 408) {
    console.log('Request timeout - try again');
  } else {
    console.error('Error:', error.message);
  }
}
```

## Individual Clients

If you only need one service:

```typescript
import { QubicLiveClient, QueryClient } from '@qubic/qts';

// Real-time data only
const live = new QubicLiveClient();

// Historical data only
const query = new QueryClient();
```

## Configuration

### Custom Timeout

```typescript
const qubic = createQubicClient({
  timeout: 60000 // 60 seconds
});
```

### Custom Base URLs

```typescript
const qubic = createQubicClient({
  liveUrl: 'https://custom-rpc.qubic.org',
  queryUrl: 'https://custom-api.qubic.org'
});
```

### Runtime Configuration

```typescript
const client = new QubicLiveClient();

// Change timeout
client.setTimeout(45000);

// Add custom headers
client.setHeaders({
  'X-API-Key': 'your-api-key'
});
```

## Next Steps

- Read the [full documentation](README.md)
- Explore [examples](examples/)
- Check out the [architecture guide](ARCHITECTURE.md)
- Learn about [smart contract interactions](README.md#smart-contract-utilities)

## Common Patterns

### Monitor Ticks in Real-Time

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

### Paginate Through Transactions

```typescript
async function getAllTransactions(identity) {
  const transactions = [];
  let offset = 0;
  const pageSize = 100;
  
  while (true) {
    const result = await qubic.query.getTransactionsForIdentityPaginated(
      identity,
      offset,
      pageSize
    );
    
    transactions.push(...result.transactions);
    
    if (result.transactions.length < pageSize) break;
    offset += pageSize;
  }
  
  return transactions;
}
```

### Filter Transactions by Type

```typescript
const result = await qubic.query.getTransactionsForIdentity(identity, {
  filters: {
    moneyFlew: 'true' // Only successful transfers
  },
  pagination: { offset: 0, size: 50 }
});
```

## Tips & Tricks

1. **Reuse clients** - Create once, use many times
2. **Handle timeouts** - Increase timeout for large queries
3. **Paginate wisely** - Don't fetch too much data at once
4. **Cache tick data** - Current tick changes slowly
5. **Check tick validity** - Balance data is valid for specific tick

## Troubleshooting

### "Request timeout"
- Increase timeout: `setTimeout(60000)`
- Check network connection
- Try again with smaller data range

### "Identity not found"
- Verify identity format (60 uppercase letters)
- Check if identity exists on network
- Ensure no extra spaces

### "Invalid hex/base64"
- Check encoding format
- Use provided encoding utilities
- Verify data length

## Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/qubic/qts/issues)
- 💬 [Discussions](https://github.com/qubic/qts/discussions)
- 💭 [Discord Community](https://discord.gg/qubic)

---

**Ready to build on Qubic? Start coding!** 🚀