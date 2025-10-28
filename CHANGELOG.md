# Changelog

## [1.4.0] - 2025-01-26

### Breaking Changes

- **Package renamed from `@nvlabs/qts` to `@nouslabs/sdk`** (forget what you know)
  - Update your imports: `import { createQubicClient } from '@nouslabs/sdk'`
  - Repository moved to `github.com/qubic/@nouslabs/sdk`
  - All documentation updated to reflect new branding

### Added

- **Unified Authentication System** - Four authentication methods under one API:
  - Private seed authentication (direct seed input)
  - Vault file support (encrypted JSON with password)
  - MetaMask Snap integration (BIP44 derivation, hardware wallet support)
  - WalletConnect support (mobile wallet via QR code)
- **React Authentication Hooks**:
  - `useQubicAuth()` - Complete authentication state management
  - `useQubicAccount()` - Get current account info
  - `useIsAuthenticated()` - Simple boolean check
  - `useAuthMethods()` - Query available methods
  - `useAccountCreation()` - Create new accounts
- **QubicAuthProvider** - React context for auth state with session persistence
- **Account Creation Utilities**:
  - `createAccount()` - Generate new Qubic accounts
  - `generateSeed()` - Cryptographically secure seed generation
  - `isValidSeed()` - Validate seed format
  - `createAccounts()` - Batch account creation
- **Base26 encoding/decoding** utilities for MetaMask BIP44 keys

### Changed

- Documentation completely restructured for clarity
- Navigation sidebar improved with icons and better organization
- All imports updated from `@nvlabs/qts` to `@nouslabs/sdk`
- GitHub repository URLs updated throughout

### Fixed

- Sidebar navigation no longer shows duplicate or missing pages
- Empty documentation folders removed
- Meta.json files now only reference existing pages
- Introduction no longer nested incorrectly in sidebar

### Removed

- AI-generated documentation summary files
- Empty placeholder directories
- Duplicate authentication documentation

## [1.3.3] - 2025-10-25

### Changed

- Removed aggressive polling in WalletConnect integration
- Replaced 2-second polling with single delayed check after approval
- Improved performance and reduced unnecessary network requests

### Added

- Manual `refreshAccounts()` method for edge cases

## [1.3.2] - 2025-10-25

### Added

- Enhanced error handling for wallet connections
- Improved WalletConnect session management

### Fixed

- Connection state synchronization issues
- Account refresh race conditions

## [1.3.1] - 2025-10-25

### Fixed

- Minor documentation improvements
- Type definition exports

## [1.3.0] - 2025-10-25

### Added

- WalletConnect v2 integration
- React Query integration helpers
- Framework integration examples

### Changed

- Improved TypeScript strict mode support
- Better error messages throughout

## [1.2.3] - 2025-10-25

### Added

- Smart contract query helpers
- Batch operation utilities
- Transaction building helpers

### Fixed

- Edge cases in balance queries
- Timeout handling improvements

## [1.2.0] - 2025-10-25

### Added

- QueryClient for historical data
- Advanced filtering and pagination
- Computor information queries

### Changed

- Split API clients into specialized interfaces
- Improved documentation structure

## [1.0.0] - 2024

Initial release

### Added

- QubicLiveClient for real-time data
- ArchiveClient for historical queries
- Complete TypeScript definitions
- Smart contract support
- Encoding/decoding utilities
- React integration helpers
- Comprehensive documentation

---

## Migration Guide

### Migrating from @nvlabs/qts to @nouslabs/sdk

**Step 1: Update package**
```bash
npm uninstall @nvlabs/qts
npm install @nouslabs/sdk
```

**Step 2: Update imports**
```typescript
// Before
import { createQubicClient } from '@nvlabs/qts';
import { useQubicAuth } from '@nvlabs/qts/react';

// After
import { createQubicClient } from '@nouslabs/sdk';
import { useQubicAuth } from '@nouslabs/sdk/react';
```

**Step 3: That's it!**
No other changes needed. All APIs remain the same.

## Support

- GitHub Issues: https://github.com/qubic/@nouslabs/sdk/issues
- GitHub Discussions: https://github.com/qubic/@nouslabs/sdk/discussions
- Discord: https://discord.gg/qubic