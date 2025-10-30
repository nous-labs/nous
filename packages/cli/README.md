# @nouslabs/cli

Command-line tools for Qubic blockchain. Built on [@nouslabs/sdk](https://github.com/nous-labs/sdk).

## Installation

### Global Installation (Recommended)

```bash
npm install -g @nouslabs/cli
```

### Run with npx

```bash
npx @nouslabs/cli <command>
```

### Local Development

```bash
git clone https://github.com/nous-labs/sdk.git
cd sdk/packages/cli
bun install
bun run dev <command>
```

## Quick Start

```bash
# Get network information
nous info

# Start interactive console session
nous

# Import an account
nous account import

# Create a new account
nous new account

# Check your balance
nous balance

# View recent transactions
nous tx --limit 10

# List all accounts
nous account list
```

---

## Commands

### Network Information

#### `nous info`

Get current Qubic network status.

```bash
nous info
```

**Options:**
- `--json` - Output as JSON

**Example:**
```bash
$ nous info
âœ“ Network information retrieved

Current Tick: 35864442
Epoch: 184
Duration: 0
```

**JSON Output:**
```bash
$ nous info --json
{
  "tick": 35864442,
  "epoch": 184,
  "duration": 0
}
```

---

### Balance Checking

#### `nous balance [identity]`

Check balance for a Qubic identity. Uses currently selected account if no identity is provided.

```bash
# Check current account balance
nous balance

# Check specific identity balance
nous balance BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA
```

**Options:**
- `--json` - Output as JSON

**Examples:**

```bash
$ nous balance
âœ“ Balance retrieved

Identity: BZVMIJXDW...QHTXEXWA
Balance: 1,234,567 QUBIC
Valid for Tick: 35864442
```

```bash
$ nous balance BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA --json
{
  "balance": 1234567,
  "validForTick": 35864442,
  "tick": 35864442,
  "epoch": 184
}
```

---

### Transaction History

#### `nous tx [identity]`

Get recent transactions for an identity. Uses currently selected account if no identity is provided.

```bash
# View transactions for current account
nous tx

# View transactions for specific identity
nous tx BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA
```

**Options:**
- `-l, --limit <number>` - Number of transactions to fetch (default: 10)
- `--json` - Output as JSON

**Examples:**

```bash
$ nous tx --limit 5
âœ“ Found 5 transactions

1. AAAAAAAAA...AAAAAAAAAA â†’ BBBBBBBBB...BBBBBBBBBB
   Amount: 1,000 QUBIC | Tick: 35864440

2. BBBBBBBBB...BBBBBBBBBB â†’ CCCCCCCCC...CCCCCCCCCC
   Amount: 500 QUBIC | Tick: 35864438

...
```

---

### Send Transactions

#### `nous send transfer <to> <amount>`

Send QUBIC to another address using the active account. The CLI reviews the transaction details and prompts for your vault password before signing and broadcasting.

```bash
nous send transfer BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA 1000
```

**Options:**
- `-f, --from <identity>` - Sender identity (uses current if not specified)
- `--tick <number>` - Target tick number
- `--tick-offset <number>` - Offset from the latest tick (default: 5)
- `--skip-review` - Skip the interactive review (still prompts for password)

#### `nous send from-file <file>`

Broadcast a previously signed transaction (base64 encoded). Pair with `nous transactions sign` for offline workflows.

```bash
nous send from-file ./signed.txt
```

**Options:**
- `--json` - Output the broadcast response as JSON

---

## Authentication

### `nous auth status`

Check current authentication status.

```bash
$ nous auth status

Authentication Status
--------------------------------------------------
Current Identity: My Wallet
Address: BZVMIJXDW...QHTXEXWA
Type: seed
Created: 2025-01-28T10:30:00.000Z
Seed stored locally: Yes
```

### `nous auth login`

Login with a seed phrase. External wallet integrations require a browser experience and are not available in the CLI.

```bash
$ nous auth login

Seed Authentication
--------------------------------------------------
? Seed (55+ lowercase letters): ***************************************
Derived identity: BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA
? Account label: My Wallet
? Store the seed encrypted for future use? (Y/n) y
Create a password to encrypt your seeds: ********
Confirm password: ********
Optional password hint (stored unencrypted):

Seed login successful.
Identity: BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA
Label: My Wallet
Stored encrypted: Yes
Seed encrypted locally. Password required for signing.
```

### `nous auth logout`

Clear current authentication.

```bash
$ nous auth logout
Logged out successfully
```

---
## Account Management

### `nous account list`

List all saved accounts.

```bash
$ nous account list

Saved Accounts
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â— My Main Wallet
  Address: BZVMIJXDW...QHTXEXWA
  Type: seed

  Trading Account
  Address: CCCCCCCCC...CCCCCCCCCC
  Type: vault
```

**Legend:**
- â— Green dot = Currently selected account

### `nous account select`

Select an account to use as default.

```bash
$ nous account select
? Select an account: (Use arrow keys)
â¯ My Main Wallet (BZVMIJXDW...QHTXEXWA)
  Trading Account (CCCCCCCCC...CCCCCCCCCC)

âœ“ Selected: My Main Wallet
```

### `nous account create`

Generate a new Qubic account with a cryptographically secure seed. This command is an alias for `nous new account`.

```bash
$ nous account create
? Account label: Trading Wallet
? Store the new seed in the encrypted vault? (Y/n) y
? Set this account as the current identity? (Y/n) y
Seed stored in encrypted vault.

New Qubic account generated.
Identity: BZVMIJXDW...QHTXEXWA
Label: Trading Wallet
Seed: **********************
Keep this seed secret. Anyone with access can control your account.
```

### `nous new account`

Dedicated entry point for the interactive account creation flow. Accepts the same options as `nous account create`.

```bash
nous new account --label "My Wallet" --no-store
```
### `nous account import`

Import an existing account.

```bash
$ nous account import
? Account label: My Wallet
? Qubic identity (60 characters): BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA
? Account type: (Use arrow keys)
â¯ seed
  vault


âœ“ Account imported: My Wallet
```

**Validations:**
- Label: Required, any string
- Identity: Must be exactly 60 uppercase letters (A-Z)
- Type: seed or vault

### `nous account remove`

Remove an account from the CLI.

```bash
$ nous account remove
? Select account to remove: (Use arrow keys)
â¯ Old Wallet (AAAAAAAAAA...AAAAAAAAAA)
  Test Account (BBBBBBBBBB...BBBBBBBBBB)

? Are you sure you want to remove this account? (y/N) y
âœ“ Removed: Old Wallet
```

**Note:** This only removes the account from the CLI configuration. It does not affect the blockchain.

---

## Configuration

### `nous config show`

Show current CLI configuration.

```bash
$ nous config show

Configuration
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Config file: /Users/you/.config/nouslabs-cli/config.json

Current Identity: BZVMIJXDW...QHTXEXWA
RPC Endpoint: Default
Network: mainnet
```

### `nous config set <key> <value>`

Set a configuration value.

```bash
# Set custom RPC endpoint
nous config set rpcEndpoint https://custom-rpc.example.com

# Set network
nous config set defaultNetwork testnet
```

**Valid Keys:**
- `rpcEndpoint` - Custom RPC endpoint URL
- `defaultNetwork` - Network name (mainnet, testnet)

### `nous config reset`

Reset all configuration to defaults.

```bash
$ nous config reset
? Are you sure you want to reset all configuration? (y/N) y
âœ“ Configuration reset
```

**Warning:** This will:
- Clear all saved accounts
- Reset RPC endpoint to default
- Clear current identity selection

---

## Configuration File

The CLI stores configuration in a JSON file:

**Location:**
- **Linux:** `~/.config/nouslabs-cli-nodejs/Config/config.json`
- **macOS:** `~/Library/Application Support/nouslabs-cli-nodejs/Config/config.json`
- **Windows:** `%APPDATA%\nouslabs-cli-nodejs\Config\config.json`

**Structure:**
```json
{
  "currentIdentity": "BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA",
  "identities": {
    "BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA": {
      "label": "My Wallet",
      "identity": "BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA",
      "type": "seed",
      "created": "2025-01-28T10:30:00.000Z"
    }
  },
  "rpcEndpoint": "https://custom-rpc.example.com",
  "defaultNetwork": "mainnet"
}
```

---

## JSON Output

Most commands support `--json` flag for machine-readable output:

```bash
nous info --json
nous balance --json
nous tx --json
```

This is useful for:
- Scripting and automation
- Integration with other tools
- Parsing results programmatically

---

## Common Workflows

### First Time Setup

```bash
# 1. Install globally
npm install -g @nouslabs/cli

# 2. Import your first account
nous account import

# 3. Check your balance
nous balance

# 4. View recent transactions
nous tx
```

### Managing Multiple Accounts

```bash
# Import multiple accounts
nous account import  # Repeat for each account

# List all accounts
nous account list

# Switch between accounts
nous account select

# Check balance of current account
nous balance

# Check balance of specific account
nous balance SPECIFIC_IDENTITY_HERE
```

### Scripting and Automation

```bash
#!/bin/bash

# Get network tick as JSON
TICK_DATA=$(nous info --json)
CURRENT_TICK=$(echo $TICK_DATA | jq -r '.tick')

echo "Current tick: $CURRENT_TICK"

# Check balance
BALANCE_DATA=$(nous balance --json)
BALANCE=$(echo $BALANCE_DATA | jq -r '.balance')

echo "Balance: $BALANCE QUBIC"
```

---

## Troubleshooting

### Command not found

```bash
$ nous: command not found
```

**Solution:** Install globally or use npx:
```bash
npm install -g @nouslabs/cli
# or
npx @nouslabs/cli info
```

### No identity selected

```bash
No identity selected. Use "nous auth login" or "nous account select"
```

**Solution:** Import and select an account:
```bash
nous account import
nous account select
```

### Network errors

```bash
Failed to fetch network info
```

**Solutions:**
- Check your internet connection
- Try a different RPC endpoint: `nous config set rpcEndpoint <url>`
- Check Qubic network status

### Scaffold

#### `nous scaffold web`

Interactive generator for a Next.js + Tailwind project preloaded with Nous Labs providers. Answer prompts for directory, package manager, dependency installs, and lint.

```bash
nous scaffold web
```
### Configuration issues

```bash
# View current config
nous config show

# Reset if corrupted
nous config reset
```

---

## Development

### Build from Source

```bash
# Clone repository
git clone https://github.com/nous-labs/sdk.git
cd sdk

# Install dependencies
bun install

# Run CLI in development
cd packages/cli
bun run dev info
```

### Build for Production

```bash
cd packages/cli
bun run build
```

### Run Tests

```bash
bun test
```

### Link Locally

```bash
cd packages/cli
npm link

# Now 'nous' command is available globally
nous info
```

---

## Environment Variables

- `DEBUG=nous:*` - Enable debug logging (coming soon)
- `NOUS_RPC_ENDPOINT` - Override RPC endpoint
- `NOUS_CONFIG_DIR` - Custom config directory

---

## Architecture

The CLI is built on:
- [@nouslabs/sdk](https://github.com/nous-labs/sdk/tree/main/packages/sdk) - Core blockchain functionality
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal colors
- [Ora](https://github.com/sindresorhus/ora) - Loading spinners
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) - Interactive prompts
- [Conf](https://github.com/sindresorhus/conf) - Configuration management

---

## Roadmap

### Coming Soon
- âœ… Account management (list, select, import, remove)
- âœ… Configuration management
- âœ… JSON output support
- ðŸš§ Interactive authentication (seed, vault)
- ðŸš§ Transaction sending with signing
- ðŸš§ Account creation with seed generation
- ðŸš§ Smart contract interaction
- ðŸš§ Batch operations

### Future
- ðŸ“‹ Transaction monitoring and notifications
- ðŸ“‹ Multi-signature support
- ðŸ“‹ Hardware wallet integration
- ðŸ“‹ Address book management
- ðŸ“‹ Transaction history export (CSV, JSON)
- ðŸ“‹ Gas estimation and optimization
- ðŸ“‹ Network statistics and analytics

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

**Areas for contribution:**
- Authentication implementation
- Transaction signing
- Smart contract helpers
- Documentation improvements
- Bug fixes and optimizations

---

## Security

**Important Security Notes:**

âš ï¸ **Never share your private keys or seeds**

The CLI stores:
- âœ… Account labels and addresses (safe to share)
- âœ… Account types (seed, vault, etc.)
- âŒ **NOT** private keys or seeds

For production use:
- Use hardware wallets when possible
- Use encrypted vault files
- Never store seeds in plain text
- Use strong passwords for vault files

---

## License

MIT License - see [LICENSE](../../LICENSE) for details.

---

### Monitoring utilities

#### `nous monitor status`

Snapshot of the latest tick, epoch, and computor counts. Use `--json` to emit structured output or `--epoch` to inspect a specific epoch.

```bash
nous monitor status --json
```

#### `nous monitor ticks`

Stream tick updates at a configurable interval. Combine `--count` or `--duration` to stop automatically.

```bash
nous monitor ticks --interval 1000 --count 10
```

#### `nous monitor computors`

Inspect the computor lists returned by the query API. Display a single list with `--list` and limit the output with `--limit`.

```bash
nous monitor computors --epoch 134 --limit 5
```

#### `nous monitor dashboard`

A live, dashboard-style view of network stats with endpoint health. Refreshes every second by default.

```bash
nous monitor dashboard --interval 1000 --history 36 --identity
```

Options:
- `-i, --interval <ms>` Refresh interval in milliseconds (default: 1000, minimum enforced: 200)
- `--no-ansi` Disable color output (keeps ASCII layout)
- `--identity` Show current identity balance (if selected)
- `-H, --history <count>` Number of samples to retain for trend graphs (default: 24)

What it shows:
- Compact HUD cards for network state, operations, latest tick, and transfers
- Current tick, epoch, tick duration (with derived ticks/s) and archive lag
- Sparkline trends for RPC/query latency and transaction volume (history-aware)
- Optional active identity module (label, balance, tick validity)
- Latest tick summary with top senders/receivers, hot contract, and the four most recent transfers

#### `nous monitor latency`

Quick latency sampler for RPC and Query endpoints.

```bash
nous monitor latency --count 10 --interval 250 --json
```

Options:
- `-n, --count <number>` Number of samples (default: 5)
- `-i, --interval <ms>` Delay between samples (default: 200)
- `--json` Print JSON summary

### Scaffolding

#### `nous scaffold web`

Generate a Next.js + Tailwind project preconfigured with Nous Labs providers and example components.

```bash
nous scaffold web --pm bun --dir qubic-dashboard
```

## Links

- **SDK Package:** [@nouslabs/sdk](https://github.com/nous-labs/sdk/tree/main/packages/sdk)
- **Documentation:** [Full Docs](https://github.com/nous-labs/sdk/tree/main/docs)
- **Report Issues:** [GitHub Issues](https://github.com/nous-labs/sdk/issues)
- **Discussions:** [GitHub Discussions](https://github.com/nous-labs/sdk/discussions)
- **Website:** [nous-labs.com](https://nous-labs.com)

---

## Support

Need help?
- [GitHub Issues](https://github.com/nous-labs/sdk/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/nous-labs/sdk/discussions) - Questions and community
- [Discord](https://discord.gg/qubic) - Qubic community

---

**Built by [Nous Labs](https://nous-labs.com)** - Developer tools for Qubic blockchain


