# Publishing Guide - @nvlabs/qts

Manual publishing guide for the Qubic TypeScript SDK.

## Prerequisites

Before publishing, ensure you have:

- npm account with access to `@nvlabs` organization
- Logged in to npm: `npm login`
- All tests passing: `bun test`
- Type checking passing: `bun run typecheck`
- Code committed to git
- Clean working directory: `git status`

## Setup npm Authentication

### First Time Setup

```bash
# Login to npm
npm login

# Verify you're logged in
npm whoami

# Should show your npm username
```

### Organization Access

Ensure you have publish access to `@nvlabs`:

1. Go to https://www.npmjs.com/settings/nvlabs/teams
2. Verify you're a member with publish permissions
3. Or create the organization if it doesn't exist

## Publishing Process

### Step 1: Pre-Publish Checklist

```bash
# 1. Ensure you're on main branch
git checkout main
git pull origin main

# 2. Check git status (should be clean)
git status

# 3. Run tests
bun test

# 4. Run type checking
bun run typecheck

# 5. Check current version
npm version
```

### Step 2: Update Version

Choose the appropriate version bump based on changes:

#### Patch Release (1.0.0 → 1.0.1)
*Bug fixes, minor improvements, documentation*

```bash
npm version patch -m "chore(release): %s"
```

#### Minor Release (1.0.0 → 1.1.0)
*New features (backward compatible)*

```bash
npm version minor -m "chore(release): %s"
```

#### Major Release (1.0.0 → 2.0.0)
*Breaking changes*

```bash
npm version major -m "chore(release): %s"
```

#### Specific Version

```bash
npm version 1.2.3 -m "chore(release): %s"
```

This will:
- Update version in `package.json`
- Create a git commit
- Create a git tag

### Step 3: Update CHANGELOG

Edit `CHANGELOG.md` and add release notes:

```markdown
## [1.0.1] - 2024-01-15

### Fixed
- Correct uint64 encoding in little-endian format
- Fix identity validation regex

### Documentation
- Add examples for QUtil contract usage
```

Commit the changelog:

```bash
git add CHANGELOG.md
git commit --amend --no-edit
```

### Step 4: Push to GitHub

```bash
# Push commits and tags
git push origin main --follow-tags
```

### Step 5: Publish to npm

```bash
# Dry run (optional - see what will be published)
npm publish --dry-run

# Publish for real
npm publish --access public
```

You should see:
```
+ @nvlabs/qts@1.0.1
```

### Step 6: Create GitHub Release

```bash
# Using GitHub CLI
gh release create v1.0.1 --generate-notes

# Or manually
# Go to: https://github.com/nvlabs/qts/releases/new
# Select the tag, add release notes, publish
```

## Verification

After publishing:

### 1. Check npm

```bash
# View package info
npm info @nvlabs/qts

# Check latest version
npm view @nvlabs/qts version

# Test installation
npm install @nvlabs/qts
```

### 2. Check npm Website

Visit: https://www.npmjs.com/package/@nvlabs/qts

Verify:
- Correct version shown
- README displays properly
- Installation instructions work

### 3. Test in a Project

```bash
# Create test project
mkdir test-qts && cd test-qts
npm init -y
npm install @nvlabs/qts

# Test import
node -e "const qts = require('@nvlabs/qts'); console.log('Success!');"
```

## Complete Publishing Script

Save this as a script for quick publishing:

```bash
#!/bin/bash
# publish.sh

set -e

echo "Publishing @nvlabs/qts"
echo ""

# Pre-checks
echo "Running pre-publish checks..."
bun test
bun run typecheck
echo "All checks passed!"
echo ""

# Version bump
echo "Current version: $(npm version --json | grep '\"@nvlabs/qts\"' | cut -d'"' -f4)"
echo ""
read -p "Version bump (patch/minor/major): " BUMP
npm version $BUMP -m "chore(release): %s"
echo ""

# Get new version
NEW_VERSION=$(npm version --json | grep '\"@nvlabs/qts\"' | cut -d'"' -f4)
echo "New version: $NEW_VERSION"
echo ""

# Update changelog
echo "Update CHANGELOG.md now and press Enter to continue..."
read
git add CHANGELOG.md
git commit --amend --no-edit

# Push
echo " Pushing to GitHub..."
git push origin main --follow-tags
echo ""

# Publish
echo "Publishing to npm..."
npm publish --access public
echo ""

echo "Published @nvlabs/qts@$NEW_VERSION!"
echo ""
echo "Next steps:"
echo "1. Create GitHub release: gh release create v$NEW_VERSION --generate-notes"
echo "2. Announce on social media"
echo "3. Update any dependent projects"
```

Make it executable:
```bash
chmod +x publish.sh
./publish.sh
```

## Troubleshooting

### Error: You do not have permission to publish

**Solution:**
```bash
# Check you're logged in
npm whoami

# Login again
npm login

# Check organization access
npm org ls nvlabs
```

### Error: Version already exists

**Solution:**
```bash
# You already published this version
# Bump to a new version
npm version patch
npm publish --access public
```

### Error: Tests failed

**Solution:**
```bash
# Fix the failing tests
bun test

# Once fixed, try again
npm version patch
npm publish --access public
```

### Error: Package name already taken

**Solution:**
```bash
# Check if @nvlabs/qts is available
npm info @nvlabs/qts

# If taken by someone else, choose a different name
# Update package.json "name" field
```

### Unpublishing (Emergency Only)

**Warning:** Unpublishing is permanent and breaks dependents!

```bash
# Unpublish specific version (within 72 hours)
npm unpublish @nvlabs/qts@1.0.1

# Deprecate instead (preferred)
npm deprecate @nvlabs/qts@1.0.1 "This version has issues, use 1.0.2"
```

## Post-Publish Tasks

### 1. Announce Release

- **Twitter/X**: " Released @nvlabs/qts v1.0.1 - TypeScript SDK for Qubic blockchain"
- **Discord**: Share in Qubic community
- **GitHub**: Create release notes with changelog
- **README**: Update if needed

### 2. Update Documentation

If you have separate docs site:
```bash
# Update docs with new version
# Deploy updated documentation
```

### 3. Monitor Issues

- Watch for issues: https://github.com/nvlabs/qts/issues
- Monitor npm downloads: `npm info @nvlabs/qts downloads`
- Check for installation problems

### 4. Update Dependent Projects

If you have projects using this library:
```bash
cd my-qubic-project
npm update @nvlabs/qts
```

## Version Strategy

### Semantic Versioning

Follow [SemVer](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
  - API changes that break existing code
  - Removed or renamed public functions
  - Changed function signatures

- **MINOR** (1.0.0 → 1.1.0): New features (backward compatible)
  - New functions or classes
  - New optional parameters
  - New contracts supported

- **PATCH** (1.0.0 → 1.0.1): Bug fixes
  - Bug fixes
  - Documentation updates
  - Performance improvements (no API changes)

### Pre-release Versions

For testing before stable release:

```bash
# Beta release
npm version 1.1.0-beta.1
npm publish --tag beta

# Alpha release
npm version 1.1.0-alpha.1
npm publish --tag alpha

# Install pre-release
npm install @nvlabs/qts@beta
```

## Security Best Practices

1. **Never commit npm tokens** to git
2. **Use 2FA** on npm account
3. **Review code** before publishing
4. **Check dependencies** for vulnerabilities: `npm audit`
5. **Use --dry-run** first to preview publish
6. **Keep credentials secure**

## Need Help?

- **npm support**: https://www.npmjs.com/support
- **npm docs**: https://docs.npmjs.com/
- **Versioning**: https://semver.org/
- **GitHub releases**: https://docs.github.com/en/repositories/releasing-projects-on-github

## Quick Reference

```bash
# Check status
npm whoami
npm version
git status

# Version bump
npm version patch|minor|major

# Publish
npm publish --access public

# Push to GitHub
git push origin main --follow-tags

# Create release
gh release create v1.0.1 --generate-notes

# Verify
npm info @nvlabs/qts
```

---

**Happy Publishing! **