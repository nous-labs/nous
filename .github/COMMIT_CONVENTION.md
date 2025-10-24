# Commit Convention Guide

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated semantic versioning and changelog generation.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type

Must be one of the following:

### Release Types (trigger version bump)

- **feat**: A new feature (minor version bump)
- **fix**: A bug fix (patch version bump)
- **perf**: Performance improvement (patch version bump)
- **refactor**: Code refactoring (patch version bump)
- **docs**: Documentation changes (patch version bump)
- **style**: Code style changes - formatting, whitespace (patch version bump)

### Non-Release Types (no version bump)

- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates
- **build**: Changes to build system
- **ci**: Changes to CI/CD configuration

### Breaking Changes

Add `BREAKING CHANGE:` in the footer or add `!` after type/scope:

```
feat!: remove deprecated API
```

or

```
feat: add new API

BREAKING CHANGE: The old API has been removed
```

This triggers a **major version bump**.

## Scope

Optional. Specifies the area of change:

- **client**: Client-related changes
- **contract**: Smart contract utilities
- **types**: Type definitions
- **validation**: Zod schemas and validation
- **encoding**: Encoding/decoding utilities
- **docs**: Documentation
- **test**: Test suite
- **ci**: CI/CD workflows

## Subject

- Use imperative, present tense: "add" not "added" or "adds"
- Don't capitalize first letter
- No period (.) at the end
- Keep under 72 characters

## Body

Optional. Provide additional context:

- Explain **what** and **why**, not **how**
- Wrap at 72 characters
- Separate from subject with blank line

## Footer

Optional. Reference issues and breaking changes:

```
Fixes #123
Closes #456

BREAKING CHANGE: API endpoint changed from /v1 to /v2
```

## Examples

### Feature (Minor Release)

```
feat(client): add support for Qearn contract queries

Implement queryQearn helper function and add QEARN to contract constants.
Users can now easily query the Qearn staking contract.

Closes #42
```

### Bug Fix (Patch Release)

```
fix(encoding): correct little-endian byte order in uint32

The uint32 encoding was using big-endian instead of little-endian,
causing contract queries to fail.

Fixes #89
```

### Performance (Patch Release)

```
perf(serializer): optimize array padding performance

Use pre-allocated buffer instead of concatenating strings,
reducing serialization time by 40%.
```

### Documentation (Patch Release)

```
docs: add examples for QUtil contract usage

Add comprehensive examples for SendToManyV1, BurnQubic, and Vote
functions in the contract types documentation.
```

### Breaking Change (Major Release)

```
feat!: change contract serializer API

BREAKING CHANGE: ContractInputSerializer.build() now returns an object
instead of a string. Use .toHex() to get the hex string.

Migration:
- Before: const hex = serializer.build()
- After: const hex = serializer.toHex()
```

### Non-Release Commit

```
test: add validation tests for QUtil schemas

Add comprehensive test coverage for all QUtil contract input/output
validation schemas using Zod.
```

```
chore(deps): update dependencies

Update semantic-release to v23.0.0 and Zod to v3.22.4
```

## Multiple Changes

If a commit contains multiple changes, consider splitting into separate commits. If not possible, list all changes:

```
feat(client): add multiple contract query helpers

- Add queryQearn for Qearn contract
- Add queryQswap for Qswap contract
- Add queryQvault for Qvault contract
```

## Tips

1. **Keep commits atomic** - One logical change per commit
2. **Write clear subjects** - Reader should understand the change without reading the body
3. **Use the body** - Explain complex changes
4. **Reference issues** - Always link to related issues
5. **Test before commit** - Run `bun test` and `bun run typecheck`
6. **Review your commit** - Use `git diff --cached` before committing

## Tools

### Commit Message Validation

Your commit messages are validated automatically. If invalid, the commit will be rejected.

### Helpful Commands

```bash
# Check if commit message is valid
echo "feat: add new feature" | npx commitlint

# View commit history
git log --oneline

# Amend last commit message
git commit --amend

# Interactive rebase to fix commit messages
git rebase -i HEAD~3
```

## Semantic Release

Based on your commits, semantic-release will:

1. Analyze commits since last release
2. Determine version bump (major/minor/patch)
3. Generate changelog
4. Create git tag
5. Publish to npm
6. Create GitHub release

### Version Bumps

- `fix:` → Patch (1.0.0 → 1.0.1)
- `feat:` → Minor (1.0.0 → 1.1.0)
- `BREAKING CHANGE:` → Major (1.0.0 → 2.0.0)

## Questions?

- See [Conventional Commits](https://www.conventionalcommits.org/)
- Check existing commits: `git log --oneline`
- Ask in discussions or issues

---

**Remember**: Good commit messages help everyone understand the project history! 📝