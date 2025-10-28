# @nouslabs/sdk Documentation

> forget what you know

This directory contains the documentation website for @nouslabs/sdk, built with [Fumadocs](https://fumadocs.dev) and [Next.js](https://nextjs.org).

## Documentation Structure

```
docs/
├── content/
│   └── docs/
│       ├── index.mdx                    # Introduction
│       ├── getting-started/             # Installation and basics
│       ├── core/                        # Core functionality
│       ├── advanced/                    # Advanced topics
│       ├── production/                  # Production guides
│       ├── examples/                    # Code examples
│       ├── api-clients.mdx              # API reference
│       ├── smart-contracts.mdx          # Smart contracts
│       ├── utilities.mdx                # Utilities
│       ├── guides/                      # Advanced guides
│       ├── integrations/                # Framework integrations
│       ├── contributing.mdx             # Contributing guide
│       └── changelog.mdx                # Version history
├── app/                                 # Next.js app directory
├── lib/                                 # Documentation utilities
└── public/                              # Static assets
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

## Documentation Pages

### Introduction (`index.mdx`)
- What is @nouslabs/sdk
- Installation instructions
- Quick start guide
- Learning path overview

### Getting Started
- Installation and setup
- First query examples
- Understanding clients
- Error handling basics

### Core Functionality
- Querying blockchain data
- User authentication (4 methods)
- Transaction building and signing
- Smart contract interaction

### Advanced Topics
- React integration with hooks
- Real-time updates
- Batch operations and optimization
- Testing strategies

### Production
- Best practices
- Security guidelines
- Monitoring and logging
- Deployment strategies

### Examples
- Practical code examples
- Common use cases
- Copy-paste solutions

### API Reference
- QubicLiveClient
- QueryClient
- ArchiveClient
- Type definitions
- Utilities

### Guides
- Real-world playbooks
- Smart contract lifecycle
- Wallet integration
- Framework recipes

### Integrations
- React simple setup
- React Query hooks
- Next.js with WalletConnect
- Backend frameworks

## Writing Documentation

### Adding New Pages

1. Create a new `.mdx` file in the appropriate directory
2. Add frontmatter:

```mdx
---
title: Page Title
description: Brief description for SEO
---

# Your Content Here
```

3. Update `meta.json` in the directory to add to navigation

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
    npm install @nouslabs/sdk
    ```
  </Tab>
</Tabs>
```

### Code Blocks

Use syntax highlighting with language tags:

````mdx
```typescript
import { createQubicClient } from '@nouslabs/sdk';
const qubic = createQubicClient();
```
````

## Customization

### Navigation

Edit `lib/navigation.ts` to customize:
- Section categories
- Icons for each page
- Default open/closed state
- Page ordering

### Configuration

Edit `source.config.ts` to customize:
- Documentation structure
- MDX processing
- Search behavior

### Styling

Tailwind CSS is used for styling. Customize in:
- `tailwind.config.js` - Theme configuration
- `app/globals.css` - Global styles

## Dependencies

- **fumadocs-core** - Documentation framework
- **fumadocs-mdx** - MDX processing
- **fumadocs-ui** - UI components
- **Next.js** - React framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

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
const example = await client.getBalance(identity);
console.log(example.balance.balance);
```
```

### Internal Links

Use relative links for internal pages:

```mdx
See the [Authentication](/docs/core/authentication) guide for details.
```

## Troubleshooting

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
- Check for unclosed tags

### Hot Reload Issues

Restart the development server:

```bash
# Stop the server (Ctrl+C)
bun run dev
```

## Best Practices

1. **Keep it simple** - Focus on clarity over complexity
2. **Working examples** - All code should be runnable
3. **Progressive disclosure** - Start simple, add complexity gradually
4. **Clear navigation** - Users should always know where they are
5. **No jargon** - Explain technical terms
6. **Mobile-friendly** - Test on different screen sizes
7. **Update changelog** - Document significant changes

## Contributing

We welcome documentation improvements! To contribute:

1. Fork the repository
2. Create a branch (`docs/improve-auth`)
3. Make your changes
4. Test locally (`bun run dev`)
5. Submit a pull request

See [Contributing Guide](../CONTRIBUTING.md) for more details.

## Resources

- [Fumadocs Documentation](https://fumadocs.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [MDX Documentation](https://mdxjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

## License

MIT License - Same as the main project

---

Built for the Qubic community