# Nous Labs - Post-Rebrand Action Plan & Roadmap

**Organization**: Nous Labs  
**Package**: @nouslabs/sdk  
**CLI**: @nouslabs/cli  
**Tagline**: Intelligent tools for Qubic blockchain  
**Version**: 1.4.0 → 2.0.0

## Phase 1: Complete Rebrand (Week 1)

### 1.1 Repository Setup

**GitHub Organization**
- [ ] Create `nous-labs` GitHub organization
- [ ] Set up organization profile
  - [ ] Add logo/avatar
  - [ ] Add description: "Intelligent tools for Qubic blockchain"
  - [ ] Add website: https://nous.dev or https://nouslabs.dev
  - [ ] Add email: hello@nouslabs.dev
- [ ] Transfer repository or create new:
  - [ ] `nous-labs/sdk` (main SDK)
  - [ ] `nous-labs/cli` (CLI tool)
  - [ ] `nous-labs/docs` (documentation site)
  - [ ] `nous-labs/examples` (example projects)

**npm Organization**
- [ ] Create `@nous` npm organization
- [ ] Add team members
- [ ] Configure organization settings
- [ ] Set up 2FA requirements

**Domain & Branding**
- [ ] Register domain: nous.dev or nouslabs.dev
- [ ] Set up email: hello@nouslabs.dev, support@nouslabs.dev
- [ ] Design logo/brand identity
- [ ] Create social media accounts (Twitter/X, Discord)

### 1.2 Code Updates

**Package Renaming**
- [x] Update package.json name to `@nouslabs/sdk`
- [x] Update all import statements
- [x] Update documentation references
- [ ] Update README.md with new branding
- [ ] Update CHANGELOG.md
- [ ] Update LICENSE (if needed)

**Documentation Site**
- [x] Update docs site branding
- [x] Update navigation and titles
- [ ] Add Nous Labs logo
- [ ] Update footer with Nous Labs info
- [ ] Update metadata (SEO, OG tags)

**CI/CD**
- [ ] Update GitHub Actions workflows
- [ ] Update npm publish scripts
- [ ] Update release automation
- [ ] Set up branch protection rules

### 1.3 Testing & Validation

- [ ] Run full test suite
- [ ] Test package publishing to npm (use `--dry-run` first)
- [ ] Verify all imports work with new package name
- [ ] Test in browser, Node.js, Bun, Deno
- [ ] Verify documentation builds correctly
- [ ] Check all external links

## Phase 2: CLI Development (Week 2-3)

### 2.1 CLI Architecture

**Project Structure**
```
nous-labs/cli/
├── src/
│   ├── commands/
│   │   ├── init.ts          # Initialize project
│   │   ├── auth/
│   │   │   ├── login.ts     # Authentication
│   │   │   ├── logout.ts
│   │   │   └── status.ts
│   │   ├── account/
│   │   │   ├── create.ts    # Create account
│   │   │   ├── balance.ts   # Check balance
│   │   │   └── list.ts
│   │   ├── transaction/
│   │   │   ├── send.ts      # Send transaction
│   │   │   ├── history.ts   # View history
│   │   │   └── status.ts
│   │   ├── contract/
│   │   │   ├── query.ts     # Query contracts
│   │   │   ├── call.ts      # Call functions
│   │   │   └── list.ts
│   │   └── config/
│   │       ├── get.ts       # Get config
│   │       ├── set.ts       # Set config
│   │       └── list.ts
│   ├── utils/
│   │   ├── config.ts        # Config management
│   │   ├── spinner.ts       # Loading indicators
│   │   ├── prompts.ts       # User input
│   │   └── format.ts        # Output formatting
│   ├── index.ts
│   └── cli.ts
├── templates/               # Project templates
├── tests/
├── package.json
└── README.md
```

**Technology Stack**
- CLI Framework: `commander` or `yargs`
- Prompts: `inquirer` or `prompts`
- Spinner: `ora`
- Colors: `chalk`
- Config: `conf`
- HTTP: Use @nouslabs/sdk

### 2.2 Core Commands

**Authentication Commands**
```bash
nous auth login              # Interactive login (choose method)
nous auth login --metamask   # MetaMask login
nous auth login --seed       # Seed login
nous auth login --vault      # Vault file login
nous auth login --wc         # WalletConnect login
nous auth logout             # Logout
nous auth status             # Show current auth status
```

**Account Commands**
```bash
nous account create          # Create new account
nous account balance [ID]    # Check balance
nous account list            # List authenticated accounts
nous account export          # Export account (backup seed)
```

**Transaction Commands**
```bash
nous send <to> <amount>      # Send QUBIC
nous tx history [ID]         # Transaction history
nous tx status <txid>        # Check transaction status
nous tx build                # Build transaction (advanced)
```

**Contract Commands**
```bash
nous contract query <name>   # Query smart contract
nous contract call <name>    # Call contract function
nous contract list           # List available contracts
```

**Network Commands**
```bash
nous network status          # Network status
nous network tick            # Current tick info
nous network peers           # Computor list
```

**Configuration Commands**
```bash
nous config list             # List all config
nous config get <key>        # Get config value
nous config set <key> <val>  # Set config value
nous config reset            # Reset to defaults
```

**Project Commands**
```bash
nous init                    # Initialize new project
nous init --template react   # Init with template
nous dev                     # Start dev environment
```

### 2.3 CLI Features

**Interactive Mode**
- Beautiful terminal UI
- Colored output with chalk
- Progress spinners with ora
- Interactive prompts for all operations
- Auto-completion support
- Command suggestions on typos

**Configuration**
- Store config in `~/.nous/config.json`
- Support multiple profiles
- Environment variable overrides
- Secure credential storage

**Output Formats**
- Default: Human-readable table format
- `--json`: JSON output for scripting
- `--csv`: CSV output for data export
- `--quiet`: Minimal output

**Global Options**
```bash
--network <name>    # testnet/mainnet
--config <path>     # Custom config path
--json             # JSON output
--verbose          # Verbose logging
--no-color         # Disable colors
```

### 2.4 CLI Development Tasks

**Week 2**
- [ ] Set up CLI project structure
- [ ] Implement commander/yargs framework
- [ ] Create config management system
- [ ] Implement auth commands (login/logout/status)
- [ ] Implement account commands (create/balance/list)
- [ ] Add unit tests

**Week 3**
- [ ] Implement transaction commands
- [ ] Implement contract query commands
- [ ] Implement network info commands
- [ ] Add interactive prompts
- [ ] Add spinners and formatting
- [ ] Add comprehensive help text
- [ ] Write CLI documentation

## Phase 3: Documentation & Examples (Week 4)

### 3.1 Documentation Updates

**Main Documentation**
- [ ] Getting Started guide (updated for @nouslabs/sdk)
- [ ] CLI documentation (complete command reference)
- [ ] Migration guide (from fwyk to @nouslabs/sdk)
- [ ] Video tutorials (optional)
- [ ] API reference (auto-generated from TSDoc)

**CLI Documentation**
- [ ] Installation guide
- [ ] Quick start tutorial
- [ ] Command reference
- [ ] Configuration guide
- [ ] Troubleshooting guide
- [ ] FAQ

**Examples Repository**
- [ ] Basic examples (balance check, send tx)
- [ ] Authentication examples (all 4 methods)
- [ ] React app example
- [ ] Next.js app example
- [ ] Vue app example
- [ ] CLI script examples
- [ ] Smart contract interaction examples

### 3.2 Starter Templates

**Create Project Templates**
```bash
nous init --template react           # React + TypeScript
nous init --template nextjs          # Next.js 14
nous init --template vue             # Vue 3
nous init --template node            # Node.js script
nous init --template cli             # CLI tool
```

**Template Features**
- Pre-configured @nouslabs/sdk
- Authentication setup
- Example components
- TypeScript support
- Testing setup
- README with instructions

## Phase 4: Publishing & Launch (Week 5)

### 4.1 Package Publishing

**SDK Package (@nouslabs/sdk)**
- [ ] Version bump to 2.0.0 (major version for rebrand)
- [ ] Update CHANGELOG.md
- [ ] Create GitHub release
- [ ] Publish to npm: `npm publish --access public`
- [ ] Verify package on npmjs.com
- [ ] Test installation: `npm install @nouslabs/sdk`

**CLI Package (@nouslabs/cli)**
- [ ] Version 1.0.0 initial release
- [ ] Update CHANGELOG.md
- [ ] Create GitHub release
- [ ] Publish to npm: `npm publish --access public`
- [ ] Test global installation: `npm install -g @nouslabs/cli`
- [ ] Verify CLI works: `nous --version`

**Documentation**
- [ ] Deploy documentation site
- [ ] Set up custom domain
- [ ] Configure SSL/HTTPS
- [ ] Set up analytics (optional)
- [ ] Submit to search engines

### 4.2 Deprecation Notice

**Old Package (fwyk)**
- [ ] Publish final version with deprecation warning
- [ ] Update README with migration notice
- [ ] Add postinstall warning message
- [ ] Point users to @nouslabs/sdk

Example deprecation in fwyk package.json:
```json
{
  "deprecated": "This package has been renamed to @nouslabs/sdk. Please use @nouslabs/sdk instead."
}
```

### 4.3 Announcement

**Release Announcement**
- [ ] Write blog post / announcement
- [ ] Post on Twitter/X
- [ ] Post on Reddit (r/qubic)
- [ ] Post on Discord
- [ ] Post on Qubic forums
- [ ] Submit to aggregators (dev.to, hackernews)

**Announcement Content**
- Introduce Nous Labs
- Explain the rebrand
- Highlight new features (CLI, auth system)
- Provide migration guide
- Show examples
- Call to action (try it, contribute, feedback)

## Phase 5: Future Development (Ongoing)

### 5.1 Short Term (1-3 months)

**SDK Enhancements**
- [ ] Add transaction building helpers
- [ ] Improve error messages
- [ ] Add request caching
- [ ] Add WebSocket support for real-time updates
- [ ] Add batch operation optimizations
- [ ] Improve TypeScript types

**CLI Enhancements**
- [ ] Add interactive TUI mode
- [ ] Add transaction signing UI
- [ ] Add QR code generation/scanning
- [ ] Add wallet backup/restore
- [ ] Add multi-sig support
- [ ] Plugin system for extensions

**Documentation**
- [ ] Add more examples
- [ ] Add video tutorials
- [ ] Improve search functionality
- [ ] Add interactive playground
- [ ] Community contributions guide

### 5.2 Medium Term (3-6 months)

**Developer Tools**
- [ ] Smart contract development toolkit
- [ ] Contract testing framework
- [ ] Local Qubic node for testing
- [ ] Transaction simulator
- [ ] Gas estimation tools

**Integrations**
- [ ] Hardhat plugin
- [ ] Truffle integration
- [ ] VSCode extension
- [ ] Web3.js compatibility layer
- [ ] Ethers.js compatibility layer

**Advanced Features**
- [ ] Hardware wallet support (Ledger, Trezor)
- [ ] Multi-chain support (if applicable)
- [ ] DeFi helpers
- [ ] NFT support
- [ ] Token management

### 5.3 Long Term (6-12 months)

**Ecosystem**
- [ ] @nous/testing - Testing framework
- [ ] @nous/contracts - Contract templates
- [ ] @nous/react-native - Mobile SDK
- [ ] @nous/python - Python SDK
- [ ] @nous/go - Go SDK

**Platform**
- [ ] Nous Labs developer portal
- [ ] API key management
- [ ] Usage analytics
- [ ] Rate limiting
- [ ] Premium features

**Community**
- [ ] Developer grants program
- [ ] Hackathon sponsorship
- [ ] Educational content
- [ ] Open source bounties
- [ ] Community showcase

## Immediate Action Items (Today)

1. **Create GitHub Organization**
   ```bash
   # Go to github.com/organizations/new
   # Organization name: nous-labs
   # Email: hello@nouslabs.dev
   ```

2. **Create npm Organization**
   ```bash
   npm login
   npm org create nous
   ```

3. **Test Package Locally**
   ```bash
   cd qts
   npm run build
   npm pack
   # Test the .tgz file in another project
   ```

4. **Update Documentation**
   - Update all references from fwyk to @nouslabs/sdk
   - Add migration guide
   - Update installation instructions

5. **Prepare for First Publish**
   ```bash
   # Dry run
   npm publish --dry-run --access public
   
   # If successful, publish
   npm publish --access public
   ```

## CLI Quick Start Scaffold

Here's the minimal CLI to get started:

**package.json**
```json
{
  "name": "@nouslabs/cli",
  "version": "1.0.0",
  "description": "CLI tool for Qubic blockchain",
  "bin": {
    "nous": "./dist/cli.js"
  },
  "main": "./dist/index.js",
  "dependencies": {
    "@nouslabs/sdk": "^1.4.0",
    "commander": "^11.1.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.1",
    "inquirer": "^9.2.12",
    "conf": "^12.0.0"
  }
}
```

**src/cli.ts**
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('nous')
  .description('CLI tool for Qubic blockchain')
  .version('1.0.0');

program
  .command('auth')
  .description('Authentication commands')
  .action(() => {
    console.log(chalk.blue('Auth commands coming soon!'));
  });

program.parse();
```

## Success Metrics

**Week 1-2**
- [ ] GitHub org created
- [ ] npm org created
- [ ] Package published
- [ ] Documentation live

**Month 1**
- [ ] 100+ npm downloads
- [ ] 10+ GitHub stars
- [ ] CLI released
- [ ] 5+ community examples

**Month 3**
- [ ] 1000+ npm downloads
- [ ] 50+ GitHub stars
- [ ] 10+ contributors
- [ ] Featured in Qubic community

**Month 6**
- [ ] 5000+ npm downloads
- [ ] 100+ GitHub stars
- [ ] Active community
- [ ] Multiple integrations

## Support & Maintenance

**Community Channels**
- GitHub Discussions (Q&A, ideas, show-and-tell)
- Discord server (real-time support)
- Twitter/X (announcements)
- Email (hello@nouslabs.dev)

**Maintenance**
- Weekly dependency updates
- Monthly feature releases
- Quarterly major versions
- Rapid security patches

## Notes

- Keep the SDK simple and focused
- CLI should be user-friendly and intuitive
- Documentation is critical for adoption
- Community feedback drives roadmap
- Security is top priority

---

**Last Updated**: January 26, 2025  
**Status**: Phase 1 in progress  
**Next Milestone**: Complete rebrand and publish v2.0.0