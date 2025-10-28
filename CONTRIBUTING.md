# Contributing to Qubic TypeScript SDK

Thank you for your interest in contributing!

## Full Contributing Guide

For comprehensive contribution guidelines, please see our detailed documentation:

**[Contributing Guide](./docs/content/docs/contributing.mdx)**

## Quick Start

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/qts.git
cd qts

# Install dependencies
bun install

# Run tests
bun test

# Type checking
bun run typecheck
```

## Quick Contribution Steps

1. **Fork** the repository
2. **Create a branch** using conventional naming:
   - `feat/your-feature` - New features
   - `fix/your-bugfix` - Bug fixes
   - `docs/your-docs` - Documentation updates
3. **Make changes** following our coding standards
4. **Test thoroughly** - All tests must pass
5. **Commit** using [conventional commits](https://www.conventionalcommits.org/):
   - `feat: add new feature`
   - `fix: resolve bug`
   - `docs: update documentation`
6. **Push** to your fork
7. **Open a Pull Request** with a clear description

## Important Documents

- **[Full Contributing Guide](./docs/content/docs/contributing.mdx)** - Detailed guidelines
- **[Architecture](./docs/content/docs/architecture.mdx)** - System design and patterns
- **[API Reference](./docs/content/docs/api-clients.mdx)** - Complete API documentation
- **[Changelog](./docs/content/docs/changelog.mdx)** - Version history

## Testing

```bash
# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Run integration tests (requires network)
bun test --run-skipped
```

## Code Standards

- **TypeScript** with strict mode
- **JSDoc** comments for all public APIs
- **Conventional commits** for clear history
- **Tests** for all new features
- **Documentation** updates when needed

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be:
- **Respectful** and considerate
- **Welcoming** to newcomers
- **Helpful** and supportive
- **Professional** in all interactions

## Need Help?

- **GitHub Issues** - [Report bugs or request features](https://github.com/qubic/@nouslabs/sdk/issues)
- **GitHub Discussions** - [Ask questions](https://github.com/qubic/@nouslabs/sdk/discussions)
- **Discord** - [Join the community](https://discord.gg/sWX3BakE)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**For detailed guidelines, coding standards, and best practices, please read the [full Contributing Guide](./docs/content/docs/contributing.mdx).**