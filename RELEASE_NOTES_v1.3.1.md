# Release Notes - v1.3.1

**Release Date**: October 25, 2025

## Overview

Version 1.3.1 is a documentation cleanup release that improves the user experience and clarifies the usage of the built-in WalletConnect provider introduced in v1.3.0.

## 🐛 Bug Fixes

### Documentation Fixes

**Duplicate Donations Button**
- Fixed duplicate "💝 Donations" button appearing in both navigation bar and sidebar
- Removed redundant navigation link (kept only in sidebar for cleaner UI)

## 📚 Documentation Improvements

### WalletConnect Integration

**Updated Examples to Use Built-in Provider**
- All examples now show usage of `WalletConnectProvider` from `@nvlabs/qts/react`
- Clarified that users don't need to create the provider manually
- Updated integrations index to reflect built-in provider availability
- Improved TypeScript type examples throughout

**Enhanced Next.js Guide**
- Added comprehensive React Query integration examples
- Complete example app showing WalletConnect + React Query working together
- Real-time balance updates and transaction tracking examples
- Smart contract interaction patterns with React Query
- Optimistic updates documentation

**Code Example Improvements**
- All examples use direct adapter access pattern for better type inference
- Removed confusing wrapper methods examples
- Added proper TypeScript type annotations

### General Cleanup

- Refactored integration guides for better clarity
- Improved code organization and structure
- Enhanced readability of technical examples
- Added more context and explanations

## 📦 No Breaking Changes

This is a pure documentation release - no code changes, fully backward compatible with v1.3.0.

## 🔗 Key Documentation Updates

- [Next.js + WalletConnect Guide](/docs/integrations/nextjs-walletconnect) - Now includes React Query integration
- [Integrations Index](/docs/integrations) - Updated to show built-in provider
- [Donations Page](/docs/donations) - Removed from navigation, kept in sidebar only

## 📊 Stats

- **Package Size**: ~2.11 MB (unchanged)
- **Dependencies**: 4 runtime dependencies (unchanged)
- **TypeScript**: Full type safety (unchanged)
- **Documentation Pages**: 42 pages (unchanged)

## 🚀 Upgrade Instructions

### From v1.3.0

No changes required - this is a documentation-only release. Simply update your package:

```bash
npm install @nvlabs/qts@latest
# or
yarn upgrade @nvlabs/qts
# or
bun update @nvlabs/qts
```

### From v1.2.x

If upgrading from v1.2.x, see the [v1.3.0 release notes](./RELEASE_NOTES_v1.3.0.md) for breaking changes and migration guide.

## 💡 Highlights

### Before (v1.3.0)
- Confusing documentation about creating WalletConnect provider manually
- Duplicate donations buttons in UI
- Mixed examples showing old and new patterns

### After (v1.3.1)
- Clear documentation: use built-in `WalletConnectProvider`
- Clean UI with donations only in sidebar
- Consistent examples using direct adapter access
- Comprehensive React Query integration guide

## 🙏 Thank You

Thank you to the community for reporting the duplicate button issue and requesting clearer documentation!

## 📝 Full Changelog

See [CHANGELOG.md](/docs/changelog) for complete version history.

## 🔗 Links

- **Documentation**: https://github.com/nvlabs/qts/tree/main/docs
- **GitHub Repository**: https://github.com/nvlabs/qts
- **npm Package**: https://www.npmjs.com/package/@nvlabs/qts
- **Report Issues**: https://github.com/nvlabs/qts/issues

---

**Full Changelog**: [View on GitHub](https://github.com/nvlabs/qts/compare/v1.3.0...v1.3.1)

*Released with ❤️ by the QTS team*