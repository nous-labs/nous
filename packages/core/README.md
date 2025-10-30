# @nouslabs/core

Core utilities for Qubic blockchain development. Shared foundation for all Nous Labs packages.

## Overview

`@nouslabs/core` provides low-level utilities used across the Nous Labs ecosystem:

- **Encoding** - Hex, Base64, byte array conversions
- **Validation** - Identity, seed, transaction validation
- **Identity** - Identity generation and conversion
- **Types** - Shared TypeScript types

This package is dependency-free (except for `@noble/hashes` and `zod`) and can be used independently.

## Installation

```bash
npm install @nouslabs/core
```

## Usage

### Encoding Utilities

Convert between different data formats:

```typescript
import {
  hexToBytes,
  bytesToHex,
  base64ToBytes,
  bytesToBase64,
  hexToBase64,
  base64ToHex,
  stringToBytes,
  bytesToString,
} from '@nouslabs/core/encoding';

// Hex conversions
const bytes = hexToBytes('48656c6c6f');
const hex = bytesToHex(bytes); // "48656c6c6f"

// Base64 conversions
const b64 = bytesToBase64(bytes); // "SGVsbG8="
const decoded = base64ToBytes(b64);

// String conversions
const strBytes = stringToBytes('Hello');
const str = bytesToString(strBytes); // "Hello"

// Direct hex <-> base64
const base64 = hexToBase64('48656c6c6f');
const hexStr = base64ToHex('SGVsbG8=');
```

### Integer Encoding

Encode and decode integers in little-endian format:

```typescript
import {
  encodeInt32LE,
  decodeInt32LE,
  encodeInt64LE,
  decodeInt64LE,
  encodeUint32LE,
  decodeUint32LE,
  encodeUint64LE,
  decodeUint64LE,
} from '@nouslabs/core/encoding';

// 32-bit integers
const bytes32 = encodeInt32LE(12345);
const num32 = decodeInt32LE(bytes32); // 12345

// 64-bit integers (uses BigInt)
const bytes64 = encodeInt64LE(9223372036854775807n);
const num64 = decodeInt64LE(bytes64); // 9223372036854775807n

// Unsigned variants
const ubytes32 = encodeUint32LE(4294967295);
const unum32 = decodeUint32LE(ubytes32);
```

### Byte Array Utilities

Work with byte arrays efficiently:

```typescript
import {
  concatBytes,
  sliceBytes,
  padBytes,
  bytesLength,
  createZeroBytes,
} from '@nouslabs/core/encoding';

// Concatenate multiple byte arrays
const combined = concatBytes(bytes1, bytes2, bytes3);

// Slice byte array
const slice = sliceBytes(bytes, 0, 10);

// Pad to specific length
const padded = padBytes(bytes, 32); // Pad to 32 bytes

// Get length
const len = bytesLength(bytes);

// Create zero-filled array
const zeros = createZeroBytes(64); // 64 zero bytes
```

### Validation

Validate Qubic data formats:

```typescript
import {
  isValidIdentity,
  isValidSeed,
  isValidTransactionHash,
  isValidHex,
  isValidBase64,
  validateIdentity,
  validateSeed,
  validateTransactionHash,
  validateAmount,
  validateTick,
} from '@nouslabs/core/validation';

// Boolean checks
if (isValidIdentity('BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA')) {
  console.log('Valid identity');
}

if (isValidSeed('abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxy')) {
  console.log('Valid seed');
}

// Validation with error messages
try {
  validateIdentity('INVALID');
} catch (error) {
  console.error(error.message); // "Invalid identity format"
}

// Validate hex and base64
if (isValidHex('48656c6c6f')) {
  console.log('Valid hex');
}

if (isValidBase64('SGVsbG8=')) {
  console.log('Valid base64');
}

// Validate amounts and ticks
validateAmount(1000); // throws if invalid
validateTick(123456); // throws if invalid
```

### Identity Utilities

Generate and convert Qubic identities:

```typescript
import {
  generateIdentity,
  seedToIdentity,
  isValidIdentityFormat,
} from '@nouslabs/core/identity';

// Convert seed to identity
const seed = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxy';
const identity = seedToIdentity(seed);
// Returns: "BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA"

// Generate identity from bytes
const bytes = new Uint8Array(32); // Your key bytes
const generated = generateIdentity(bytes);

// Validate identity format
if (isValidIdentityFormat(identity)) {
  console.log('Valid format');
}
```

### TypeScript Types

Import shared types:

```typescript
import type {
  Transaction,
  Balance,
  TickInfo,
  BlockInfo,
  TransactionStatus,
  NetworkInfo,
  Identity,
  Seed,
  TransactionHash,
} from '@nouslabs/core/types';

const tx: Transaction = {
  source: 'AAAAAA...',
  destination: 'BBBBBB...',
  amount: 1000,
  tickNumber: 123456,
  status: 'confirmed',
};

const balance: Balance = {
  balance: 1000000,
  validForTick: 123456,
  tick: 123456,
  epoch: 184,
};
```

## Package Exports

```typescript
// Main export
import * from '@nouslabs/core';

// Subpath exports
import * from '@nouslabs/core/encoding';
import * from '@nouslabs/core/validation';
import * from '@nouslabs/core/identity';
import * from '@nouslabs/core/types';
```

## API Reference

### Encoding

| Function | Description | Input | Output |
|----------|-------------|-------|--------|
| `hexToBytes` | Convert hex string to bytes | `string` | `Uint8Array` |
| `bytesToHex` | Convert bytes to hex string | `Uint8Array` | `string` |
| `base64ToBytes` | Convert base64 to bytes | `string` | `Uint8Array` |
| `bytesToBase64` | Convert bytes to base64 | `Uint8Array` | `string` |
| `hexToBase64` | Convert hex to base64 | `string` | `string` |
| `base64ToHex` | Convert base64 to hex | `string` | `string` |
| `stringToBytes` | Convert string to UTF-8 bytes | `string` | `Uint8Array` |
| `bytesToString` | Convert UTF-8 bytes to string | `Uint8Array` | `string` |
| `encodeInt32LE` | Encode 32-bit int (LE) | `number` | `Uint8Array` |
| `decodeInt32LE` | Decode 32-bit int (LE) | `Uint8Array` | `number` |
| `encodeInt64LE` | Encode 64-bit int (LE) | `bigint` | `Uint8Array` |
| `decodeInt64LE` | Decode 64-bit int (LE) | `Uint8Array` | `bigint` |
| `concatBytes` | Concatenate byte arrays | `...Uint8Array[]` | `Uint8Array` |
| `sliceBytes` | Slice byte array | `Uint8Array, number, number` | `Uint8Array` |
| `padBytes` | Pad bytes to length | `Uint8Array, number` | `Uint8Array` |
| `createZeroBytes` | Create zero-filled array | `number` | `Uint8Array` |

### Validation

| Function | Description | Returns |
|----------|-------------|---------|
| `isValidIdentity(id)` | Check if valid Qubic identity | `boolean` |
| `isValidSeed(seed)` | Check if valid Qubic seed | `boolean` |
| `isValidTransactionHash(hash)` | Check if valid tx hash | `boolean` |
| `isValidHex(str)` | Check if valid hex string | `boolean` |
| `isValidBase64(str)` | Check if valid base64 | `boolean` |
| `validateIdentity(id)` | Validate identity (throws) | `void` |
| `validateSeed(seed)` | Validate seed (throws) | `void` |
| `validateAmount(amount)` | Validate amount (throws) | `void` |
| `validateTick(tick)` | Validate tick number (throws) | `void` |

### Identity

| Function | Description | Returns |
|----------|-------------|---------|
| `seedToIdentity(seed)` | Convert seed to identity | `string` |
| `generateIdentity(bytes)` | Generate identity from bytes | `string` |
| `isValidIdentityFormat(id)` | Check identity format | `boolean` |

## Why @nouslabs/core?

This package exists to:

1. **Reduce Duplication** - Shared utilities across SDK, CLI, and React packages
2. **Minimize Dependencies** - Core package has minimal dependencies
3. **Enable Tree-Shaking** - Import only what you need
4. **Provide Flexibility** - Use core utils without full SDK
5. **Maintain Consistency** - Single source of truth for encoding/validation

## Used By

- [@nouslabs/sdk](https://github.com/nous-labs/sdk/tree/main/packages/sdk) - Main SDK
- [@nouslabs/cli](https://github.com/nous-labs/sdk/tree/main/packages/cli) - CLI tools
- [@nouslabs/react](https://github.com/nous-labs/sdk/tree/main/packages/react) - React hooks

## Dependencies

- `@noble/hashes` - Cryptographic hashing
- `zod` - Runtime validation

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Type check
bun run typecheck

# Run tests
bun test
```

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Links

- [Main Repository](https://github.com/nous-labs/sdk)
- [SDK Package](https://github.com/nous-labs/sdk/tree/main/packages/sdk)
- [CLI Package](https://github.com/nous-labs/sdk/tree/main/packages/cli)
- [Documentation](https://github.com/nous-labs/sdk/tree/main/docs)
- [Website](https://nous-labs.com)

---

**Built by [Nous Labs](https://nous-labs.com)** - Developer tools for Qubic blockchain