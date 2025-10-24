# Release Guide

This document explains how releases work in the @navia-labs/qts project.

## Overview

We use [semantic-release](https://github.com/semantic-release/semantic-release) for automated releases. This means:

- ✅ **Automated versioning** based on commit messages
- ✅ **Automated changelog** generation
- ✅ **Automated npm publishing**
- ✅ **Automated GitHub releases**
- ✅ **No manual version bumps** needed

## How It Works

### 1. Commit to Main

When you merge a PR to `main` (or push commits):

```bash
git push origin main
```

### 2. CI Runs

GitHub Actions automatically:
1. Runs all tests
2. Checks types
3. Analyzes commit messages
4. Determines version bump
5. Generates changelog
6. Creates git tag
7. Publishes to npm
8. Creates GitHub release

### 3. Release Published

Within minutes, your changes are live on npm! 🎉

## Version Bumping Rules

Based on [Conventional Commits](https://www.conventionalcommits.org/):

| Commit Type | Example | Version Bump |
|-------------|---------|--------------|
| `fix:` | `fix: correct encoding bug` | Patch (1.0.0 → 1.0.1) |
| `feat:` | `feat: add new contract` | Minor (1.0.0 → 1.1.0) |
| `BREAKING CHANGE:` | `feat!: change API` | Major (1.0.0 → 2.0.0) |
| `docs:` | `docs: update README` | Patch (1.0.0 → 1.0.1) |
| `perf:` | `perf: optimize serializer` | Patch (1.0.0 → 1.0.1) |
| `refactor:` | `refactor: simplify code` | Patch (1.0.0 → 1.0.1) |
| `test:` | `test: add more tests` | No release |
| `chore:` | `chore: update deps` | No release |

## Release Types

### Patch Release (1.0.0 → 1.0.1)

Bug fixes and minor improvements:

```bash
git commit -m "fix: correct uint64 encoding"
git commit -m "docs: add examples"
git commit -m "perf: improve serialization speed"
```

### Minor Release (1.0.0 → 1.1.0)

New features (backward compatible):

```bash
git commit -m "feat: add support for Qearn contract"
git commit -m "feat: add Zod validation schemas"
```

### Major Release (1.0.0 → 2.0.0)

Breaking changes:

```bash
git commit -m "feat!: change serializer API

BREAKING CHANGE: Serializer.build() now returns object instead of string.
Use .toHex() to get hex string.

Migration:
- Before: const hex = serializer.build()
- After: const hex = serializer.toHex()"
```

## Release Branches

### Main Branch (Stable)

- **Branch**: `main`
- **Releases**: Stable versions (1.0.0, 1.1.0, etc.)
- **npm tag**: `latest`
- **Use**: Production-ready code

### Beta Branch (Pre-release)

- **Branch**: `beta`
- **Releases**: Beta versions (1.1.0-beta.1, 1.1.0-beta.2, etc.)
- **npm tag**: `beta`
- **Use**: Testing new features before stable release

## Creating a Release

### Stable Release

1. **Merge PR to main:**
   ```bash
   gh pr merge 123 --merge
   ```

2. **Wait for CI:**
   - Check GitHub Actions: https://github.com/navia-labs/qts/actions
   - Release workflow runs automatically

3. **Verify release:**
   - Check npm: https://www.npmjs.com/package/@navia-labs/qts
   - Check GitHub releases: https://github.com/navia-labs/qts/releases

### Beta Release

1. **Merge PR to beta branch:**
   ```bash
   git checkout beta
   git merge feature-branch
   git push origin beta
   ```

2. **CI publishes beta:**
   - Version: `1.1.0-beta.1`
   - npm tag: `beta`
   - Install: `npm install @navia-labs/qts@beta`

3. **Promote to stable:**
   ```bash
   git checkout main
   git merge beta
   git push origin main
   ```

## Changelog

Changelog is automatically generated in `CHANGELOG.md`:

```markdown
# Changelog

## [1.1.0] - 2024-01-15

### ✨ Features
- feat: add support for Qearn contract queries (#123)
- feat: add Zod validation schemas (#124)

### 🐛 Bug Fixes
- fix: correct uint64 little-endian encoding (#125)

### 📚 Documentation
- docs: add contract serialization guide (#126)
```

## What Gets Released

### Included:
- ✅ `src/` directory (TypeScript source)
- ✅ `index.ts` (main entry point)
- ✅ `README.md` (documentation)
- ✅ `LICENSE` (MIT license)
- ✅ `package.json` (with updated version)

### Excluded:
- ❌ Tests (`test/`)
- ❌ Examples (`examples/`)
- ❌ GitHub workflows (`.github/`)
- ❌ Development files (`tsconfig.json`, `.gitignore`)

See `files` field in `package.json` for exact list.

## npm Publishing

### Authentication

Releases require `NPM_TOKEN` secret in GitHub:

1. Generate npm token: https://www.npmjs.com/settings/tokens
2. Add to GitHub secrets: Settings → Secrets → Actions → `NPM_TOKEN`

### Registry

Publishes to: https://registry.npmjs.org/

Package: `@navia-labs/qts`

Access: Public

## GitHub Releases

Each release creates a GitHub release with:

- **Tag**: `v1.1.0`
- **Title**: `v1.1.0`
- **Body**: Generated changelog
- **Assets**: `.tgz` distribution package
- **Labels**: Automatically labels issues/PRs as "released"

View releases: https://github.com/navia-labs/qts/releases

## Troubleshooting

### Release Failed

**Check CI logs:**
```bash
gh run list --workflow=release.yml
gh run view <run-id> --log
```

**Common issues:**

1. **Tests failed**: Fix failing tests
2. **No release needed**: No releasable commits since last release
3. **npm auth failed**: Check `NPM_TOKEN` secret
4. **Git auth failed**: Check `GITHUB_TOKEN` permissions

### Force Release

If you need to force a release:

1. **Add empty commit with feat:**
   ```bash
   git commit --allow-empty -m "feat: trigger release"
   git push origin main
   ```

2. **Or manually trigger:**
   - Go to Actions tab
   - Select "Release" workflow
   - Click "Run workflow"

### Skip Release

Add `[skip ci]` to commit message:

```bash
git commit -m "docs: minor typo fix [skip ci]"
```

Or use non-releasing commit type:

```bash
git commit -m "chore: update dependencies"
```

### Revert Release

If a release has issues:

1. **Deprecate on npm:**
   ```bash
   npm deprecate @navia-labs/qts@1.1.0 "This version has issues, use 1.1.1"
   ```

2. **Create fix release:**
   ```bash
   git commit -m "fix: critical bug in release 1.1.0"
   git push origin main
   ```

3. **Or publish previous version:**
   ```bash
   npm publish --tag latest @navia-labs/qts@1.0.9
   ```

## Manual Release (Emergency)

If CI is down, you can release manually:

```bash
# Install dependencies
npm install

# Run tests
npm test
npm run typecheck

# Set version
npm version 1.1.0

# Create git tag
git tag v1.1.0
git push origin v1.1.0

# Publish to npm
npm publish --access public

# Create GitHub release
gh release create v1.1.0 --generate-notes
```

## Pre-release Workflow

For testing before stable release:

```bash
# 1. Create feature branch
git checkout -b feature/new-contract

# 2. Make changes and commit
git commit -m "feat: add new contract support"

# 3. Merge to beta
git checkout beta
git merge feature/new-contract
git push origin beta
# → Publishes 1.1.0-beta.1

# 4. Test beta version
npm install @navia-labs/qts@beta

# 5. If good, merge to main
git checkout main
git merge beta
git push origin main
# → Publishes 1.1.0
```

## Release Checklist

Before merging to main:

- [ ] All tests pass
- [ ] Type checking passes
- [ ] Documentation updated
- [ ] Examples tested
- [ ] Breaking changes documented
- [ ] CHANGELOG will be auto-generated (don't update manually)
- [ ] Commit messages follow convention
- [ ] PR reviewed and approved

## Release Notes

Customize release notes by editing the commit message body:

```bash
git commit -m "feat: add new feature

This adds support for X, Y, and Z.

Benefits:
- Improved performance
- Better error handling
- More flexibility

Closes #123"
```

The body text appears in:
- Changelog
- GitHub release notes
- npm release description

## Monitoring Releases

### GitHub Actions
https://github.com/navia-labs/qts/actions/workflows/release.yml

### npm Package
https://www.npmjs.com/package/@navia-labs/qts

### GitHub Releases
https://github.com/navia-labs/qts/releases

### Download Stats
```bash
npm info @navia-labs/qts downloads
```

## Support

Questions about releases?

- Check [semantic-release docs](https://semantic-release.gitbook.io/)
- Ask in GitHub discussions
- Open an issue

---

**Remember**: The best part about semantic-release is that it just works! Focus on good commit messages, and let automation handle the rest. 🚀