# Qubic TypeScript SDK - Architecture Documentation

## Overview

The Qubic TypeScript SDK (QTS) is a comprehensive library for integrating with the Qubic blockchain. It provides type-safe, modern async/await APIs for querying blockchain data, interacting with smart contracts, and managing transactions.

## Design Principles

1. **Type Safety First** - Complete TypeScript definitions for all APIs
2. **Developer Experience** - Simple, intuitive APIs with sensible defaults
3. **Universal Compatibility** - Works in browsers, Node.js, Bun, and Deno
4. **Modular Design** - Tree-shakeable exports, import only what you need
5. **Error Resilience** - Comprehensive error handling and meaningful error messages
6. **Zero Dependencies** - Core functionality has no external dependencies
7. **Performance** - Efficient encoding/decoding with minimal overhead

## Project Structure

```
qts/
 src/
    clients/          # API client implementations
       base-client.ts          # Base HTTP client with error handling
       qubic-live-client.ts    # Real-time network data
       archive-client.ts       # Historical data (legacy)
       query-client.ts         # Advanced querying (recommended)
       index.ts                # Client exports
    types/            # Type definitions
       common.ts               # Shared types across all APIs
       responses.ts            # API response types
       index.ts                # Type exports
    utils/            # Utility functions
       encoding.ts             # Hex/Base64/Binary conversions
       smart-contract.ts       # Contract query/response helpers
       index.ts                # Utility exports
    index.ts          # Main entry point
 examples/             # Usage examples
 test/                 # Test suite
 index.ts              # Root entry point
 package.json          # Package configuration
 tsconfig.json         # TypeScript configuration
 README.md             # User documentation
```

## Architecture Layers

### 1. Transport Layer (Base Client)

**File**: `src/clients/base-client.ts`

The base client handles all HTTP communication with configurable:
- Base URLs
- Request timeouts
- Custom headers
- Fetch implementation (for testing/compatibility)

**Key Features**:
- Unified error handling
- Request/response interception
- Timeout management
- AbortController integration

**Design Pattern**: Template Method
- `get()` and `post()` methods implement common HTTP logic
- Derived clients focus on API-specific concerns

### 2. API Client Layer

Three specialized clients correspond to Qubic's API endpoints:

#### QubicLiveClient (`https://rpc.qubic.org`)
**Purpose**: Real-time network state and operations

**Capabilities**:
- Current tick information
- Balance queries
- Asset management (issued/owned/possessed)
- Smart contract queries
- Transaction broadcasting

**Use Cases**:
- Wallet applications
- Real-time dashboards
- Smart contract interactions
- Transaction submission

#### QueryClient (`https://api.qubic.org`)
**Purpose**: Advanced historical data querying (recommended)

**Capabilities**:
- Archive status and processed ticks
- Transaction history with filters
- Tick data retrieval
- Computor lists per epoch
- Advanced pagination and range queries

**Use Cases**:
- Block explorers
- Analytics platforms
- Historical data analysis
- Transaction auditing

#### ArchiveClient (`https://rpc.qubic.org`)
**Purpose**: Legacy historical data access (deprecated endpoints)

**Status**: Many methods are deprecated in favor of QueryClient
**Migration Path**: Use QueryClient for new development

### 3. Type System Layer

**File**: `src/types/`

**Philosophy**: Complete type coverage for compile-time safety

**Organization**:
- `common.ts` - Shared types (Transaction, Balance, TickInfo, etc.)
- `responses.ts` - Endpoint-specific response types
- Discriminated unions for polymorphic responses
- Optional properties where API may omit fields

**Benefits**:
- IDE autocomplete
- Compile-time error detection
- Self-documenting code
- Refactoring safety

### 4. Utility Layer

#### Encoding Utilities (`src/utils/encoding.ts`)

**Purpose**: Binary data manipulation for smart contract I/O

**Capabilities**:
- Format conversions (hex  base64  bytes  UTF-8)
- Integer encoding/decoding (little-endian)
- Hex string manipulation
- Validation functions

**Use Cases**:
- Smart contract request preparation
- Response data parsing
- Transaction encoding
- Binary protocol handling

#### Smart Contract Helpers (`src/utils/smart-contract.ts`)

**Purpose**: Simplified smart contract interaction

**Components**:

1. **SmartContractQuery** (Builder Pattern)
   - Fluent API for building contract requests
   - Automatic size calculation
   - Type-safe data appending
   - Direct execution support

2. **SmartContractResponse** (Parser Pattern)
   - Sequential data reading
   - Offset tracking
   - Type-safe extraction
   - Remaining data detection

3. **Contract Constants**
   - Known contract indices (QX, QUTIL, QUOTTERY, RANDOM)
   - Convenience query functions

**Example Flow**:
```typescript
// Build query
const query = createQuery(QUBIC_CONTRACTS.QX, 1)
  .addInt32(assetId)
  .addInt64(amount);

// Execute
const response = await query.execute(client);

// Parse
const parser = parseResponse(response.responseData);
const result = parser.readInt64();
```

## Design Patterns

### 1. Factory Pattern
**Location**: `createQubicClient()`
**Purpose**: Unified client creation with all services
**Benefit**: Single configuration point for all APIs

### 2. Builder Pattern
**Location**: `SmartContractQuery`
**Purpose**: Fluent API for complex data structures
**Benefit**: Readable, chainable contract query construction

### 3. Template Method Pattern
**Location**: `BaseClient`
**Purpose**: Common HTTP logic with extension points
**Benefit**: DRY principle, consistent error handling

### 4. Strategy Pattern
**Location**: Custom `fetchFn` in `ClientConfig`
**Purpose**: Pluggable HTTP implementation
**Benefit**: Testing, Node.js compatibility, custom transports

### 5. Parser Pattern
**Location**: `SmartContractResponse`
**Purpose**: Sequential binary data extraction
**Benefit**: Type-safe parsing with offset management

## Data Flow

### Query Flow (Read Operations)

```
User Code
    
Client Method (e.g., getBalance)
    
BaseClient.get()
    
HTTP Request (fetch)
    
Response Validation
    
JSON Parsing
    
Typed Response
    
User Code
```

### Smart Contract Query Flow

```
User Code
    
SmartContractQuery.build()
    
Data Encoding (hex/base64)
    
QubicLiveClient.querySmartContract()
    
HTTP POST to /v1/querySmartContract
    
Response (base64 data)
    
SmartContractResponse.parse()
    
Decoded Values
    
User Code
```

## Error Handling Strategy

### Error Types

1. **Network Errors** (status: 0)
   - Connection failures
   - DNS resolution failures
   - Network timeouts

2. **HTTP Errors** (status: 400-599)
   - 400: Bad Request (invalid parameters)
   - 404: Not Found (resource doesn't exist)
   - 500: Server Error (API malfunction)

3. **Timeout Errors** (status: 408)
   - Request exceeded configured timeout
   - AbortController triggered

4. **API Errors** (with RpcStatus)
   - Qubic-specific error codes
   - Detailed error messages
   - Optional error details array

### Error Handling Best Practices

```typescript
try {
  const result = await client.getBalance(identity);
} catch (error) {
  const apiError = error as QubicApiError;
  
  if (apiError.status === 0) {
    // Network issue - retry
  } else if (apiError.status === 404) {
    // Resource not found - handle gracefully
  } else if (apiError.status === 408) {
    // Timeout - increase timeout or retry
  } else {
    // Other error - log and report
  }
}
```

## Performance Considerations

### 1. Request Batching
**Recommendation**: Group related queries when possible
- Fetch multiple assets in one call using filter endpoints
- Use pagination efficiently to reduce round trips

### 2. Caching Strategy
**User Implementation**: Library doesn't cache, you should:
- Cache tick info for short periods (tick duration)
- Cache balance data with tick validation
- Cache historical data indefinitely (immutable)

### 3. Timeout Configuration
**Defaults**: 30 seconds
**Tuning**:
- Increase for slow networks or large datasets
- Decrease for real-time applications with strict SLAs

### 4. Tree Shaking
**Import Strategy**:
```typescript
//  Good - imports only what's needed
import { QubicLiveClient } from '@qubic/qts';

//  Less optimal - imports everything
import * as qts from '@qubic/qts';
```

## Testing Strategy

### Unit Tests
**Coverage**: Core utilities and builders
- Encoding/decoding functions
- Query builders
- Response parsers
- Client initialization

### Integration Tests
**Coverage**: API clients (skipped by default)
- Live API calls
- Error handling
- Response validation

**Running Tests**:
```bash
# Unit tests only
bun test

# Include integration tests
bun test --run-skipped
```

## Extension Points

### 1. Custom Fetch Implementation

```typescript
const client = new QubicLiveClient({
  fetchFn: async (url, options) => {
    // Custom logging
    console.log('Request:', url);
    const response = await fetch(url, options);
    console.log('Response:', response.status);
    return response;
  }
});
```

### 2. Custom Headers

```typescript
const client = new QubicLiveClient({
  headers: {
    'X-API-Key': 'your-key',
    'X-Request-ID': generateRequestId()
  }
});
```

### 3. Runtime Configuration

```typescript
// Change base URL for testing
client.setBaseUrl('https://test.qubic.org');

// Add authentication
client.setHeaders({ 'Authorization': 'Bearer token' });

// Increase timeout for slow operations
client.setTimeout(60000);
```

## Security Considerations

### 1. API Keys
- Never hardcode API keys
- Use environment variables
- Implement key rotation

### 2. Input Validation
- Library validates types via TypeScript
- Users should validate business logic
- Sanitize user inputs before encoding

### 3. HTTPS Only
- All default endpoints use HTTPS
- Custom URLs should use HTTPS
- No sensitive data in query parameters

### 4. Rate Limiting
- Implement client-side rate limiting
- Handle 429 responses gracefully
- Use exponential backoff for retries

## Future Enhancements

### Planned Features

1. **WebSocket Support**
   - Real-time tick updates
   - Transaction confirmations
   - Event subscriptions

2. **Transaction Building**
   - Type-safe transaction construction
   - Signature helpers
   - Multi-signature support

3. **Wallet Integration**
   - Key management utilities
   - Signing abstractions
   - HD wallet support

4. **Advanced Caching**
   - Optional built-in cache layer
   - Configurable cache strategies
   - Cache invalidation hooks

5. **Retry Logic**
   - Automatic retry with backoff
   - Configurable retry policies
   - Circuit breaker pattern

### Migration Path

**From Archive API to Query API**:
```typescript
// Old (deprecated)
const tx = await archive.getTransaction(txId);

// New (recommended)
const tx = await query.getTransactionByHash(txId);
```

## Contributing Guidelines

### Adding New Endpoints

1. Define types in `src/types/common.ts` or `responses.ts`
2. Add method to appropriate client
3. Add JSDoc documentation
4. Export from `src/index.ts`
5. Add tests in `test/`
6. Update examples in `examples/`
7. Document in `README.md`

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc for all public APIs
- Include usage examples in comments
- Format with Prettier (if configured)

### Testing Requirements

- Unit tests for utilities
- Type tests for complex types
- Integration tests for new clients
- Example code that runs without errors

## Versioning Strategy

**Semantic Versioning (SemVer)**:
- **Major**: Breaking changes to public API
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, no API changes

**Deprecation Policy**:
1. Mark as deprecated with JSDoc `@deprecated`
2. Provide migration path in documentation
3. Keep for at least one major version
4. Remove in next major version

## Conclusion

The Qubic TypeScript SDK is designed for:
- **Developer happiness**: Intuitive APIs, excellent TypeScript support
- **Production readiness**: Error handling, timeouts, configurability
- **Future growth**: Extensible architecture, clear patterns
- **Community**: Well-documented, tested, open source

For questions or contributions, see README.md or open an issue on GitHub.

---

**Last Updated**: 2024
**Version**: 1.0.0
**Maintainers**: Qubic Community