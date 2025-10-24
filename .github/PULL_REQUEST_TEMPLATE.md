# Pull Request

## Description

Please provide a clear and concise description of your changes.

### What does this PR do?

<!-- Describe the changes and their purpose -->

### Why is this change needed?

<!-- Explain the motivation or problem this solves -->

### Related Issues

<!-- Link related issues using keywords: Fixes #123, Closes #456, Relates to #789 -->

Fixes #
Closes #

## Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update
- [ ] 🔧 Chore (dependency updates, configs, etc.)

## Changes Made

<!-- List the main changes in bullet points -->

- 
- 
- 

## Breaking Changes

<!-- If this is a breaking change, describe the impact and migration path -->

**Is this a breaking change?** No / Yes

<!-- If yes, explain: -->
- **What breaks:**
- **Migration guide:**
- **Alternative approach:**

## Testing

### Test Coverage

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass locally (`bun test`)
- [ ] Type checking passes (`bun run typecheck`)

### Manual Testing

<!-- Describe how you tested these changes -->

**Tested on:**
- [ ] Node.js 18.x
- [ ] Node.js 20.x
- [ ] Bun
- [ ] Browser (specify which):

**Test scenarios:**
1. 
2. 
3. 

## Code Quality

- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No unnecessary console.logs or debug code
- [ ] No new warnings introduced
- [ ] TypeScript types are properly defined
- [ ] Zod validation schemas added where appropriate

## Documentation

- [ ] README updated (if needed)
- [ ] API documentation updated (JSDoc)
- [ ] CHANGELOG.md will be auto-generated (no manual update needed)
- [ ] Examples added/updated (if applicable)
- [ ] Contract documentation updated (if adding new contracts)

## Commit Convention

- [ ] Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] Commit messages are clear and descriptive
- [ ] No fixup or WIP commits (squash if needed)

**Example commit message:**
```
feat(client): add support for new contract

Add QueryClient method for querying the new contract.
Includes validation schemas and examples.

Closes #123
```

## Dependencies

- [ ] No new dependencies added
- [ ] OR: New dependencies are justified and documented below

**New dependencies (if any):**
<!-- List new dependencies and explain why they're needed -->

## Performance Impact

<!-- Describe any performance implications -->

- [ ] No performance impact
- [ ] Performance improved
- [ ] Performance impact is acceptable (explain below)

**Performance notes:**

## Security Considerations

<!-- Any security implications? -->

- [ ] No security implications
- [ ] Security reviewed (explain below)

## Screenshots/Examples

<!-- If applicable, add screenshots or code examples -->

**Before:**
```typescript
// Old code
```

**After:**
```typescript
// New code
```

## Checklist Before Requesting Review

- [ ] I have read the [CONTRIBUTING.md](../CONTRIBUTING.md) guide
- [ ] I have checked there aren't other open PRs for the same issue
- [ ] My code follows the project's coding conventions
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix/feature works
- [ ] All tests pass locally
- [ ] Any dependent changes have been merged and published

## Additional Context

<!-- Add any other context, screenshots, or information about the PR -->

## Reviewers

<!-- Tag specific reviewers if needed -->

@

---

**Thank you for your contribution! 🎉**

We'll review your PR as soon as possible. If you have any questions, feel free to ask in the comments.