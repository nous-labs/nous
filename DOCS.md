# Documentation Overview

Welcome to the Qubic TypeScript SDK documentation! This guide will help you navigate the comprehensive documentation available for this project.

## Documentation Structure

The documentation is organized in two main locations:

### 1. Root Directory
- **README.md** - Quick start guide, installation, and basic usage
- **CONTRIBUTING.md** - Guidelines for contributing to the project (duplicate in /docs)
- **LICENSE** - MIT License information

### 2. Documentation Site (`/docs`)
Comprehensive documentation built with Fumadocs and Next.js, available at `/docs`:

- **[Getting Started](./docs/content/docs/index.mdx)** - Installation, quick start, and key concepts
- **[API Clients](./docs/content/docs/api-clients.mdx)** - Complete reference for all API clients
- **[Smart Contracts](./docs/content/docs/smart-contracts.mdx)** - Guide to querying Qubic smart contracts
- **[Utilities & Encoding](./docs/content/docs/utilities.mdx)** - Encoding, decoding, and utility functions
- **[Architecture](./docs/content/docs/architecture.mdx)** - Design patterns, structure, and internals
- **[Contributing](./docs/content/docs/contributing.mdx)** - Detailed contribution guidelines
- **[Changelog](./docs/content/docs/changelog.mdx)** - Version history and release notes

## Quick Navigation

### For New Users
1. Start with [README.md](./README.md) for quick setup
2. Read [Getting Started](./docs/content/docs/index.mdx) for detailed introduction
3. Explore [API Clients](./docs/content/docs/api-clients.mdx) for API reference
4. Check [Smart Contracts](./docs/content/docs/smart-contracts.mdx) for contract querying

### For Contributors
1. Read [Contributing Guide](./docs/content/docs/contributing.mdx)
2. Understand [Architecture](./docs/content/docs/architecture.mdx)
3. Review [Changelog](./docs/content/docs/changelog.mdx) for recent changes

### For Advanced Users
1. [Utilities & Encoding](./docs/content/docs/utilities.mdx) - Deep dive into data manipulation
2. [Architecture](./docs/content/docs/architecture.mdx) - Design patterns and internals
3. [Smart Contracts](./docs/content/docs/smart-contracts.mdx) - Advanced contract interactions

## Documentation Content

### README.md (Root)
**Purpose**: Entry point for the project

**Contents**:
- Quick installation
- Basic usage examples
- Key features
- Links to comprehensive docs
- Community resources

**When to use**: First time exploring the project, quick reference

---

### Getting Started (`/docs/content/docs/index.mdx`)
**Purpose**: Comprehensive introduction

**Contents**:
- Detailed installation instructions
- Core concepts explanation
- Configuration options
- Common patterns
- Next steps guidance

**When to use**: Learning the SDK fundamentals

---

### API Clients (`/docs/content/docs/api-clients.mdx`)
**Purpose**: Complete API reference

**Contents**:
- QubicLiveClient - All methods with parameters, returns, and examples
- QueryClient - Historical data querying
- ArchiveClient - Legacy API (with deprecation notices)
- Error handling strategies
- Best practices

**When to use**: Looking up specific API methods, understanding client capabilities

---

### Smart Contracts (`/docs/content/docs/smart-contracts.mdx`)
**Purpose**: Guide to contract interactions

**Contents**:
- Overview of all Qubic contracts (QX, Qearn, Qswap, etc.)
- Query building with SmartContractQuery
- Response parsing with SmartContractResponse
- Contract-specific examples
- Complete workflow demonstrations

**When to use**: Interacting with smart contracts, building queries, parsing responses

---

### Utilities & Encoding (`/docs/content/docs/utilities.mdx`)
**Purpose**: Data manipulation reference

**Contents**:
- Format conversions (hex, base64, bytes, strings)
- Integer encoding/decoding (little-endian)
- Hex manipulation utilities
- Validation functions
- Complete examples and best practices

**When to use**: Encoding contract data, parsing responses, working with binary data

---

### Architecture (`/docs/content/docs/architecture.mdx`)
**Purpose**: Deep dive into SDK design

**Contents**:
- Design principles
- Project structure
- Architecture layers (Transport, API, Types, Utilities)
- Design patterns (Factory, Builder, Template Method, etc.)
- Data flow diagrams
- Performance considerations
- Extension points

**When to use**: Understanding internals, contributing features, architecture decisions

---

### Contributing (`/docs/content/docs/contributing.mdx`)
**Purpose**: Guidelines for contributors

**Contents**:
- Code of conduct
- Development setup
- How to contribute (bugs, features, docs)
- Pull request process
- Coding standards
- Testing guidelines
- Commit message conventions

**When to use**: Before making contributions, understanding project standards

---

### Changelog (`/docs/content/docs/changelog.mdx`)
**Purpose**: Version history and updates

**Contents**:
- Release notes for all versions
- Breaking changes
- Migration guides
- Deprecation notices
- Roadmap for future releases

**When to use**: Checking what's new, planning upgrades, understanding changes

---

## Running the Documentation Site

To view the full documentation site locally:

```bash
cd docs
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to browse the interactive documentation.

## Documentation Maintenance

### Adding New Documentation

1. **For simple updates**: Edit the relevant `.mdx` file in `/docs/content/docs/`
2. **For new pages**: Create a new `.mdx` file with proper frontmatter
3. **For README changes**: Edit `README.md` in the root directory

### Documentation Standards

- **Clear headings**: Use descriptive section titles
- **Code examples**: Include working, tested examples
- **Type information**: Show TypeScript types and interfaces
- **Error handling**: Demonstrate proper error handling
- **Best practices**: Highlight recommended approaches
- **Links**: Cross-reference related documentation

### Testing Documentation

Before committing documentation changes:

1. **Build the docs site**: `cd docs && bun run build`
2. **Check for broken links**: Verify all internal links work
3. **Test code examples**: Ensure all code samples are valid
4. **Review formatting**: Check MDX syntax and components
5. **Mobile check**: View on different screen sizes

## Documentation Features

### Interactive Components

The documentation site includes:
- **Syntax highlighting** - Color-coded code blocks
- **Tabbed content** - Multiple installation/usage options
- **Callouts** - Info, warning, error, and tip boxes
- **Search** - Full-text search across all documentation
- **Navigation** - Sidebar with all pages organized
- **Dark mode** - Automatic theme switching

### MDX Features

Documentation uses MDX (Markdown + JSX):
- Import React components
- Use interactive examples
- Embed custom UI elements
- Dynamic content generation

## Documentation Metrics

**Total Documentation Pages**: 7 comprehensive guides
**Lines of Documentation**: 5000+ lines
**Code Examples**: 100+ working examples
**Coverage**: All APIs, utilities, and patterns documented

## Migration from Old Docs

The following files were **moved to `/docs`** and are no longer in the root:

- ~~ARCHITECTURE.md~~ → `/docs/content/docs/architecture.mdx`
- ~~CONTRACTS.md~~ → `/docs/content/docs/smart-contracts.mdx`
- ~~EASY_CONTRACTS.md~~ → Integrated into smart-contracts.mdx
- ~~QUICKSTART.md~~ → `/docs/content/docs/index.mdx`
- ~~SETUP.md~~ → Integrated into contributing.mdx
- ~~PUBLISHING.md~~ → Removed (CI/CD handles this)
- ~~CHANGELOG.md~~ → `/docs/content/docs/changelog.mdx`

**Why?** Consolidating all detailed documentation in one place makes it easier to maintain, search, and navigate.

## Tips for Using the Docs

### For Learning
1. Start with README.md
2. Follow the Getting Started guide
3. Try the code examples
4. Explore API reference as needed

### For Building
1. Keep API reference open
2. Use smart contracts guide for queries
3. Reference utilities for data handling
4. Check examples for patterns

### For Contributing
1. Read contributing guide thoroughly
2. Understand architecture
3. Follow coding standards
4. Update relevant documentation

## Improving Documentation

Found an error? Have a suggestion? We welcome documentation improvements!

**How to help:**
- Fix typos or unclear wording
- Add more examples
- Improve explanations
- Add diagrams or illustrations
- Update outdated information

See the [Contributing Guide](./docs/content/docs/contributing.mdx) for details.

## Getting Help

If the documentation doesn't answer your question:

- **GitHub Issues**: [Report bugs or request clarification](https://github.com/nvlabs/qts/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/nvlabs/qts/discussions)
- **Discord**: [Chat with the community](https://discord.gg/qubic)

## License

All documentation is licensed under MIT License, same as the project.

---

**Documentation last updated**: 2024
**SDK Version**: 1.0.0
**Maintained by**: nvlabs and the Qubic community

For the latest updates, always refer to the documentation site in `/docs`.