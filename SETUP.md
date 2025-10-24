# @nvlabs/qts Setup Guide

Complete setup guide for the Qubic TypeScript SDK with semantic-release, automated testing, and CI/CD.

## Package Information

- **Package Name**: `@nvlabs/qts`
- **Version**: Automatically managed by semantic-release
- **License**: MIT
- **Registry**: https://registry.npmjs.org/

## Quick Start for Developers

### Prerequisites

```bash
# Required
- Node.js 18+ or Bun 1.0+
- Git

# Recommended
- GitHub CLI (gh)
- npm account for publishing
```

### Clone and Install

```bash
git clone https://github.com/nvlabs/qts.git
cd qts
bun install
```

### Run Tests

```bash
# Run all tests
bun test

# Type checking
bun run typecheck

# Lint
bun run lint

# Build
bun run build
```

## Project Structure

```
qts/
 .github/
    workflows/
       ci.yml              # CI workflow (tests, lint, build)
       release.yml         # Release workflow (semantic-release)
    COMMIT_CONVENTION.md    # Commit message guide
    PULL_REQUEST_TEMPLATE.md
    RELEASING.md            # Release process guide
 src/
    clients/                # API clients (Live, Archive, Query)
    types/                  # TypeScript type definitions
    utils/                  # Utilities (encoding, validation, contracts)
 test/                       # Test suite
 examples/                   # Usage examples
 .releaserc.json            # Semantic release configuration
 package.json               # Package configuration with semantic-release
 README.md                  # User documentation
```

## Semantic Release

### How It Works

The project uses **semantic-release** for automated versioning and publishing:

1. **Commit to main**  Triggers CI
2. **CI runs tests**  Ensures quality
3. **Semantic-release analyzes commits**  Determines version bump
4. **Auto-generates changelog**  Updates CHANGELOG.md
5. **Creates git tag**  Tags the release
6. **Publishes to npm**  Makes package available
7. **Creates GitHub release**  Publishes release notes

### Configuration

Located in `.releaserc.json` and `package.json`:

- **Commit analyzer**: Determines version from commits
- **Release notes generator**: Creates changelog
- **Changelog plugin**: Updates CHANGELOG.md
- **npm plugin**: Publishes to npm registry
- **Git plugin**: Commits version changes
- **GitHub plugin**: Creates GitHub releases

### Version Bump Rules

| Commit Prefix | Version Change | Example |
|--------------|----------------|---------|
| `fix:` | Patch (1.0.0  1.0.1) | `fix: correct encoding` |
| `feat:` | Minor (1.0.0  1.1.0) | `feat: add contract` |
| `feat!:` or `BREAKING CHANGE:` | Major (1.0.0  2.0.0) | `feat!: change API` |
| `docs:`, `perf:`, `refactor:` | Patch | Documentation/improvements |
| `test:`, `chore:` | No release | No version bump |

### Release Branches

- **main**  Stable releases (1.0.0, 1.1.0, etc.) with `latest` npm tag
- **beta**  Pre-releases (1.1.0-beta.1) with `beta` npm tag

## GitHub Workflows

### CI Workflow (`.github/workflows/ci.yml`)

**Triggers**: Push to main/beta, Pull requests

**Jobs**:
1. **test** - Runs on multiple OS (Ubuntu, Windows, macOS) with Bun
2. **lint** - Type checking and linting
3. **build** - Verifies package builds correctly
4. **node-compatibility** - Tests with Node.js 18.x, 20.x, 21.x
5. **all-checks-passed** - Verifies all jobs succeeded

**Matrix Testing**:
- Operating Systems: Ubuntu, Windows, macOS
- Runtimes: Bun 1.0.0, Bun latest
- Node.js: 18.x, 20.x, 21.x

### Release Workflow (`.github/workflows/release.yml`)

**Triggers**: Push to main or beta branches

**Jobs**:
1. **test** - Runs full test suite
2. **release** - Executes semantic-release
3. **notify** - Reports release status

**Required Secrets**:
- `GITHUB_TOKEN` - Automatically provided by GitHub
- `NPM_TOKEN` - Must be added manually (see below)

### Setting Up NPM Token

1. Generate token at https://www.npmjs.com/settings/tokens
2. Select "Automation" token type
3. Copy the token
4. Go to GitHub repo  Settings  Secrets  Actions
5. Create new secret: `NPM_TOKEN` with your token value

## Commit Convention

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance

### Examples

```bash
# Feature (minor release)
git commit -m "feat(client): add Qearn contract support"

# Bug fix (patch release)
git commit -m "fix(encoding): correct little-endian byte order"

# Breaking change (major release)
git commit -m "feat!: change serializer API

BREAKING CHANGE: Serializer.build() removed. Use .toHex() instead."

# Documentation (patch release)
git commit -m "docs: add contract examples"

# No release
git commit -m "test: add validation tests"
git commit -m "chore: update dependencies"
```

See [COMMIT_CONVENTION.md](.github/COMMIT_CONVENTION.md) for full guide.

## Testing

### Test Framework

- **Runtime**: Bun test
- **Test files**: `test/**/*.test.ts`
- **Coverage**: Available with `bun test --coverage`

### Running Tests

```bash
# All tests
bun test

# Watch mode
bun test --watch

# With coverage
bun test --coverage

# Specific file
bun test test/basic.test.ts
```

### Test Structure

```typescript
import { describe, test, expect } from "bun:test";

describe("Feature Name", () => {
  test("should do something", () => {
    // Arrange
    const input = "test";
    
    // Act
    const result = doSomething(input);
    
    // Assert
    expect(result).toBe("expected");
  });
});
```

### Integration Tests

Integration tests are skipped by default (marked with `test.skip`). Run them with:

```bash
bun test --run-skipped
```

## Zod Validation

The project uses Zod for runtime validation of contract inputs/outputs.

### Location

`src/utils/validation.ts`

### Schemas Available

- `QubicIdentitySchema` - Validates Qubic identities
- `AssetSchema` - Validates asset structures
- `QUtilSendToManyV1InputSchema` - QUtil SendToMany input
- `QuerySmartContractRequestSchema` - Smart contract queries
- `TransactionSchema` - Transaction validation
- And many more...

### Usage

```typescript
import {
  QubicIdentitySchema,
  validateIdentity,
  parseIdentity,
  safeParse,
} from '@nvlabs/qts';

// Validate
if (validateIdentity(myId)) {
  // TypeScript now knows myId is valid
}

// Parse (throws on invalid)
const id = parseIdentity(userInput);

// Safe parse (no throw)
const result = safeParse(QubicIdentitySchema, userInput);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.errors);
}
```

## Security

### Secrets Required

1. **NPM_TOKEN** - For publishing to npm
   - Generate at: https://www.npmjs.com/settings/tokens
   - Type: Automation token
   - Add to: GitHub repo secrets

2. **GITHUB_TOKEN** - For GitHub releases
   - Automatically provided by GitHub Actions
   - No manual setup required

### Permissions

Release workflow needs:
- `contents: write` - Create tags and releases
- `issues: write` - Comment on issues
- `pull-requests: write` - Comment on PRs
- `id-token: write` - npm provenance

## Publishing

### Automatic (Recommended)

1. Merge PR to `main`
2. CI runs and publishes automatically
3. Check npm: https://www.npmjs.com/package/@nvlabs/qts

### Manual (Emergency Only)

```bash
# Only if CI is broken
npm version 1.1.0
npm publish --access public
git tag v1.1.0
git push origin v1.1.0
gh release create v1.1.0 --generate-notes
```

## Troubleshooting

### Tests Failing

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lock
bun install
bun test
```

### Type Errors

```bash
# Run type checker
bun run typecheck

# Check specific file
bun run tsc --noEmit src/file.ts
```

### Release Not Triggering

Check:
1. Commit messages follow convention
2. Tests pass on main branch
3. NPM_TOKEN secret is set
4. GitHub Actions are enabled

View logs:
```bash
gh run list --workflow=release.yml
gh run view <run-id> --log
```

### Can't Push to Main

Main branch is protected. Use PRs:
```bash
git checkout -b fix/issue
git commit -m "fix: issue description"
git push origin fix/issue
gh pr create
```

## Contributing

### Workflow

1. **Fork** the repository
2. **Create branch**: `git checkout -b feat/my-feature`
3. **Make changes** with conventional commits
4. **Run tests**: `bun test && bun run typecheck`
5. **Push**: `git push origin feat/my-feature`
6. **Create PR** using the template
7. **Wait for review** and CI to pass
8. **Merge** when approved

### PR Checklist

- [ ] Tests pass
- [ ] Types check
- [ ] Commit messages follow convention
- [ ] Documentation updated
- [ ] No breaking changes (or documented if yes)
- [ ] PR template filled out

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guide.

## Monitoring

### GitHub Actions

https://github.com/nvlabs/qts/actions

### npm Package

https://www.npmjs.com/package/@nvlabs/qts

### Releases

https://github.com/nvlabs/qts/releases

### Download Stats

```bash
npm info @nvlabs/qts
npm info @nvlabs/qts downloads
```

## Useful Links

- [Semantic Release Docs](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Bun Test Docs](https://bun.sh/docs/cli/test)
- [Zod Documentation](https://zod.dev/)

## Support

- **Issues**: https://github.com/nvlabs/qts/issues
- **Discussions**: https://github.com/nvlabs/qts/discussions
- **Email**: Contact nvlabs

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with by nvlabs**

For Qubic integration needs, choose @nvlabs/qts! 