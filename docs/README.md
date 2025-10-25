# Qubic TypeScript SDK Documentation

This directory contains the documentation website for the Qubic TypeScript SDK, built with [Fumadocs](https://fumadocs.dev) and [Next.js](https://nextjs.org).

## Documentation Structure

```
docs/
├── content/
│   └── docs/
│       ├── index.mdx              # Getting Started
│       ├── api-clients.mdx        # API Clients Reference
│       ├── smart-contracts.mdx    # Smart Contracts Guide
│       ├── utilities.mdx          # Utilities & Encoding
│       ├── architecture.mdx       # Architecture & Design
│       ├── contributing.mdx       # Contributing Guide
│       └── changelog.mdx          # Version History
├── app/                           # Next.js app directory
├── lib/                           # Documentation utilities
└── public/                        # Static assets
```

```
docs/
├─ content/
│  └─ docs/
│     ├─ index.mdx                       # Getting Started
│     ├─ api-clients.mdx                 # API Clients Reference
│     ├─ smart-contracts.mdx             # Smart Contracts Guide
│     ├─ utilities.mdx                   # Utilities & Encoding
│     ├─ architecture.mdx                # Architecture & Design
│     ├─ contributing.mdx                # Contributing Guide
│     ├─ changelog.mdx                   # Version History
│     └─ guides/
│        ├─ index.mdx                    # Advanced Guides overview
│        ├─ real-world-playbooks.mdx     # Production playbooks
│        ├─ smart-contract-lifecycle.mdx # Contract lifecycle deep dive
│        ├─ wallet-integration.mdx       # Wallet provider helpers
│        └─ framework-integrations.mdx   # React/Vue/Angular + backend samples
├─ app/
├─ lib/
└─ public/
```

## Quick Start

### Prerequisites

- Node.js 18+ or Bun 1.0+
- npm, yarn, or bun

### Installation

```bash
cd docs
bun install
```

### Development

Run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the documentation.

### Build

Build the documentation for production:

```bash
bun run build
```

Start the production server:

```bash
bun run start
```

## 📖 Documentation Pages

### Getting Started (`index.mdx`)
- Installation instructions
- Quick start guide
- Basic examples
- Key features overview

### API Clients (`api-clients.mdx`)
- QubicLiveClient reference
- QueryClient reference
- ArchiveClient reference
- Complete method documentation
- Error handling guide

### Smart Contracts (`smart-contracts.mdx`)
- Contract overview
- Query building
- Response parsing
- Contract-specific guides
- Examples for all major contracts

### Utilities (`utilities.mdx`)
- Encoding/decoding functions
- Format conversions
- Integer serialization
- Hex manipulation
- Validation utilities

### Architecture (`architecture.mdx`)
- Design principles
- Project structure
- Design patterns
- Data flow
- Performance considerations

### Contributing (`contributing.mdx`)
- Code of conduct
- Development setup
- Pull request process
- Coding standards
- Testing guidelines

### Changelog (`changelog.mdx`)
- Version history
- Migration guides
- Deprecation notices
- Roadmap

### Advanced Guides (`guides/*.mdx`)
- Opinionated playbooks for price boards, vault monitors, and governance bots
- Smart contract lifecycle deep dives with QPI restrictions explained
- Wallet integration helpers for detecting providers and forwarding signed transactions
- Framework recipes for React, Vue, Angular on the front-end and Node/Hono/Elysia on the back-end
- Operational checklists for monitoring, retries, and observability

## ✍️ Writing Documentation

### Adding New Pages

1. Create a new `.mdx` file in `content/docs/`
2. Add frontmatter:

```mdx
---
title: Page Title
description: Page description for SEO
---

# Your Content Here
```

3. The page will be automatically added to the documentation

### Using Components

Fumadocs provides several components:

```mdx
import { Callout } from 'fumadocs-ui/components/callout';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

<Callout type="info">
  This is an info callout
</Callout>

<Tabs items={['npm', 'yarn', 'bun']}>
  <Tab value="npm">
    ```bash
    npm install
    ```
  </Tab>
</Tabs>
```

### Code Blocks

Use syntax highlighting with language tags:

````mdx
```typescript
import { createQubicClient } from '@nvlabs/qts';
const qubic = createQubicClient();
```
````

## 🎨 Customization

### Configuration

Edit `source.config.ts` to customize:
- Documentation structure
- Navigation
- Search behavior
- Theme settings

### Styling

Tailwind CSS is used for styling. Customize in:
- `tailwind.config.js` - Theme configuration
- `app/globals.css` - Global styles

## Dependencies

- **fumadocs-core** - Documentation framework core
- **fumadocs-mdx** - MDX processing
- **fumadocs-ui** - UI components
- **Next.js** - React framework
- **Tailwind CSS** - Styling

## Maintenance

### Updating Content

1. Edit relevant `.mdx` files in `content/docs/`
2. Changes are hot-reloaded in development
3. Test thoroughly before committing
4. Build and verify production build

### Adding Examples

Add code examples directly in MDX files:

```mdx
### Example Title

```typescript
// Your example code
const example = 'value';
```
```

### Links

Use relative links for internal pages:

```mdx
See the [API Reference](/docs/api-clients) for more details.
```

## 🐛 Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clean install
rm -rf node_modules .next
bun install
bun run build
```

### MDX Parsing Errors

- Check frontmatter syntax
- Ensure proper component imports
- Validate code block syntax

### Hot Reload Issues

Restart the development server:

```bash
# Stop the server (Ctrl+C)
bun run dev
```

## Best Practices

1. **Keep examples simple** - Focus on one concept at a time
2. **Use callouts** - Highlight important information
3. **Add code comments** - Explain complex examples
4. **Test all code** - Ensure examples work
5. **Update changelog** - Document significant changes
6. **Cross-link pages** - Help users find related content
7. **Mobile-friendly** - Test on different screen sizes

## Contributing to Docs

We welcome documentation improvements! To contribute:

1. Fork the repository
2. Create a branch (`docs/improve-examples`)
3. Make your changes
4. Test locally (`bun run dev`)
5. Submit a pull request

See [Contributing Guide](../CONTRIBUTING.md) for more details.

## License

Same as the main project - MIT License.

## Resources

- [Fumadocs Documentation](https://fumadocs.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [MDX Documentation](https://mdxjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Built with love for the Qubic community**
