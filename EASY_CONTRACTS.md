# Easy Smart Contract Querying

Simple, high-level functions for querying Qubic smart contracts with automatic serialization and deserialization.

## Why Easy Contracts?

Instead of manually building queries and parsing responses, use pre-built functions that handle everything for you.

### Before (Old Way)

```typescript
import { QubicLiveClient, createQuery, parseResponse, QUBIC_CONTRACTS } from '@nvlabs/qts';

const client = new QubicLiveClient();

// Get QX entity - requires manual building and parsing
const query = createQuery(QUBIC_CONTRACTS.QX, 1)
  .addInt32(1);

const response = await query.execute(client);
const parser = parseResponse(response.responseData);

const result = {
  entityId: parser.readInt32(),
  orderCount: parser.readInt32(),
};
```

### After (Easy Way)

```typescript
import { QubicLiveClient, qx } from '@nvlabs/qts';

const client = new QubicLiveClient();

// Get QX entity - one line!
const result = await qx.getEntity(client, 1);
```

## Installation

```bash
npm install @nvlabs/qts
```

## Quick Start

```typescript
import { QubicLiveClient, qx, qutil, qearn } from '@nvlabs/qts';

const client = new QubicLiveClient();

// QX Exchange
const fees = await qx.getFees(client);
const entity = await qx.getEntity(client, 1);
const orderBook = await qx.getOrderBook(client, 0, 0, 10);

// QUTIL
const info = await qutil.getContractInfo(client);

// QEARN Staking
const staking = await qearn.getStakingInfo(client, 'YOUR_IDENTITY');
const totalStaked = await qearn.getTotalStaked(client);
```

## Available Contracts

### QX (Decentralized Exchange)

```typescript
import { qx } from '@nvlabs/qts';

// Get entity information
const entity = await qx.getEntity(client, entityId);
// Returns: { entityId, orderCount }

// Get order book for asset pair
const orderBook = await qx.getOrderBook(client, assetPairId, offset, count);
// Returns: { raw, parser }

// Get exchange fees
const fees = await qx.getFees(client);
// Returns: { assetIssuanceFee, transferFee, tradeFee }
```

### QUTIL (Utility Functions)

```typescript
import { qutil } from '@nvlabs/qts';

// Send to multiple addresses
const result = await qutil.sendToMany(client, [
  { address: 'IDENTITY1...', amount: 1000n },
  { address: 'IDENTITY2...', amount: 2000n },
]);

// Get contract information
const info = await qutil.getContractInfo(client);
// Returns: { contractIndex, contractName }
```

### QUOTTERY (Betting Platform)

```typescript
import { quottery } from '@nvlabs/qts';

// Get active bet information
const bet = await quottery.getActiveBet(client, betId);
// Returns: { betId, creator, amount, active }

// Get list of bets
const bets = await quottery.getBetList(client, offset, count);

// Get bets for a specific user
const userBets = await quottery.getUserBets(client, identity);
```

### RANDOM (Random Number Generator)

```typescript
import { random } from '@nvlabs/qts';

// Get random number
const randomNum = await random.getRandomNumber(client);
// Returns: { randomNumber, tick }

// Get random number with seed
const seededRandom = await random.getRandomNumber(client, 12345);

// Get random bytes
const randomBytes = await random.getRandomBytes(client, 32);
// Returns: { bytes, raw }
```

### QEARN (Staking Platform)

```typescript
import { qearn } from '@nvlabs/qts';

// Get staking info for an identity
const staking = await qearn.getStakingInfo(client, identity);
// Returns: { stakedAmount, earnedAmount, lockUntilTick }

// Get total staked amount
const total = await qearn.getTotalStaked(client);
// Returns: { totalStaked, totalStakers }

// Get rewards for tick range
const rewards = await qearn.getRewards(client, startTick, endTick);
```

### QSWAP (Token Swap)

```typescript
import { qswap } from '@nvlabs/qts';

// Get swap pair information
const pair = await qswap.getPairInfo(client, pairId);
// Returns: { pairId, token0, token1, reserve0, reserve1 }

// Get swap quote
const quote = await qswap.getQuote(client, 1000n, 'QUBIC', 'QX');
// Returns: { amountOut, priceImpact }
```

### QVAULT (Vault Contract)

```typescript
import { qvault } from '@nvlabs/qts';

// Get vault balance
const vault = await qvault.getVaultBalance(client, vaultId);
// Returns: { vaultId, balance, owner }

// Get all vaults for a user
const vaults = await qvault.getUserVaults(client, identity);
```

### CCF (Computor Controlled Fund)

```typescript
import { ccf } from '@nvlabs/qts';

// Get fund information
const fund = await ccf.getFundInfo(client);
// Returns: { totalFunds, activeProposals, executedProposals }

// Get specific proposal
const proposal = await ccf.getProposal(client, proposalId);
// Returns: { proposalId, amount, status, votesFor, votesAgainst }
```

## Generic Query Functions

For contracts not yet supported or custom queries:

### Custom Query with Builder

```typescript
import { query } from '@nvlabs/qts';

const result = await query(
  client,
  contractIndex,
  inputType,
  (q) => {
    // Build your query
    q.addInt32(123)
      .addInt64(456n)
      .addString('hello');
  },
  (parser) => {
    // Parse the response
    return {
      value1: parser.readInt32(),
      value2: parser.readInt64(),
      text: parser.readString(32),
    };
  }
);
```

### Simple Query

```typescript
import { simpleQuery } from '@nvlabs/qts';

// Query with no parameters
const result = await simpleQuery(client, contractIndex, inputType);
// Returns: { raw, parser, response }

// Then parse manually if needed
const value = result.parser.readInt64();
```

## Complete Example

```typescript
import { QubicLiveClient, qx, qearn, random } from '@nvlabs/qts';

async function main() {
  const client = new QubicLiveClient();
  
  // Get exchange fees
  const fees = await qx.getFees(client);
  console.log('QX Fees:', fees);
  
  // Get staking info
  const identity = 'YOUR_IDENTITY_HERE';
  const staking = await qearn.getStakingInfo(client, identity);
  console.log('Staked:', staking.stakedAmount);
  console.log('Earned:', staking.earnedAmount);
  
  // Get random number
  const rand = await random.getRandomNumber(client);
  console.log('Random:', rand.randomNumber);
  
  // Get total staked across all users
  const total = await qearn.getTotalStaked(client);
  console.log('Total staked:', total.totalStaked);
  console.log('Total stakers:', total.totalStakers);
}

main();
```

## Error Handling

```typescript
try {
  const result = await qx.getEntity(client, 1);
  console.log(result);
} catch (error) {
  if (error.status === 404) {
    console.log('Entity not found');
  } else if (error.status === 408) {
    console.log('Request timeout');
  } else {
    console.error('Error:', error.message);
  }
}
```

## Working with Raw Data

If you need access to raw response data:

```typescript
const result = await qx.getOrderBook(client, 0, 0, 10);

// Access raw base64/hex data
console.log('Raw:', result.raw);

// Use parser for custom parsing
const value = result.parser.readInt64();
const text = result.parser.readString(32);
```

## Tips

1. **Reuse client instances** - Create once, use many times
2. **Handle timeouts** - Increase timeout for complex queries
3. **Check response structure** - Some contracts may return different formats
4. **Use TypeScript** - Get auto-completion and type checking

## Still Need the Old Way?

The original query builder is still available:

```typescript
import { createQuery, parseResponse, QUBIC_CONTRACTS } from '@nvlabs/qts';

const query = createQuery(QUBIC_CONTRACTS.QX, 1)
  .addInt32(123)
  .addInt64(456n);

const response = await query.execute(client);
const parser = parseResponse(response.responseData);
```

## Contract Indices Reference

```typescript
import { QUBIC_CONTRACTS } from '@nvlabs/qts';

QUBIC_CONTRACTS.QX              // 1  - Exchange
QUBIC_CONTRACTS.QUOTTERY        // 2  - Betting
QUBIC_CONTRACTS.RANDOM          // 3  - RNG
QUBIC_CONTRACTS.QUTIL           // 4  - Utilities
QUBIC_CONTRACTS.QEARN           // 9  - Staking
QUBIC_CONTRACTS.QSWAP           // 10 - Swap
QUBIC_CONTRACTS.QVAULT          // 11 - Vault
QUBIC_CONTRACTS.CCF             // 17 - Fund
// ... and more
```

## Need Help?

- Check the full documentation: [README.md](README.md)
- Report issues: [GitHub Issues](https://github.com/nvlabs/qts/issues)
- Join the community: [Qubic Discord](https://discord.gg/qubic)

## Contributing

Want to add more easy functions? Check [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT License - see [LICENSE](LICENSE)