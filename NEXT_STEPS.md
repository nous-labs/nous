# Nous Labs - Immediate Next Steps

**Status**: Rebrand Complete ✓  
**Next Milestone**: Publish @nouslabs/sdk v2.0.0  
**Target**: Within 48 hours

---

## ✅ Completed

- [x] Rebranded from fwyk to @nouslabs/sdk
- [x] Updated all code references
- [x] Updated documentation
- [x] Fixed navigation sidebar
- [x] Removed AI-generated documentation
- [x] Created comprehensive roadmap

---

## 🚀 Critical Path (Do These First)

### 1. Create GitHub Organization (30 minutes)

```bash
# Go to: https://github.com/organizations/new
# Name: nous-labs
# Email: hello@nouslabs.dev (create this first)
# Billing: Free for open source
```

**Setup checklist:**
- [ ] Create organization `nous-labs`
- [ ] Add profile picture/logo
- [ ] Add bio: "Intelligent tools for Qubic blockchain"
- [ ] Add website URL (when ready)
- [ ] Set up organization email

### 2. Create npm Organization (15 minutes)

```bash
# Login to npm
npm login

# Create organization
npm org create nous

# Invite team members (if any)
npm org set nous <username> developer
```

**Important:** You'll need to be logged into npm and have 2FA enabled.

### 3. Test & Publish SDK (1 hour)

```bash
cd qts

# Update version for major release
npm version 2.0.0 -m "Release v2.0.0 - Rebrand to Nous Labs"

# Test locally first
npm run test
npm run typecheck

# Dry run publish
npm publish --dry-run --access public

# If successful, publish!
npm publish --access public

# Create GitHub release
git tag v2.0.0
git push origin v2.0.0
```

### 4. Transfer Repository (30 minutes)

**Option A: Transfer existing repo**
- Go to repository settings
- Transfer to `nous-labs` organization
- Update all links in documentation

**Option B: Create fresh repo**
- Create new repo: `nous-labs/sdk`
- Push current code
- Update package.json repository URLs
- Archive old repo with deprecation notice

---

## 📋 Week 1 Tasks

### Monday-Tuesday: Setup & Publish

- [ ] Complete GitHub org setup
- [ ] Complete npm org setup
- [ ] Publish @nouslabs/sdk v2.0.0
- [ ] Update package.json with correct URLs
- [ ] Create GitHub release with changelog
- [ ] Test installation: `npm install @nouslabs/sdk`

### Wednesday-Thursday: Documentation

- [ ] Deploy documentation site
- [ ] Register domain (nous.dev or nouslabs.dev)
- [ ] Set up email forwarding
- [ ] Update all documentation links
- [ ] Write migration guide from fwyk
- [ ] Create Twitter/X account (@nous_labs)

### Friday: Announcement

- [ ] Write release announcement
- [ ] Post on GitHub Discussions
- [ ] Post on Twitter/X
- [ ] Post on Reddit r/qubic
- [ ] Post on Qubic Discord
- [ ] Update personal profiles to link to Nous Labs

---

## 🛠️ Week 2-3: CLI Development

### Project Setup

```bash
# Create new directory
mkdir cli
cd cli

# Initialize project
npm init -y

# Install dependencies
npm install commander chalk ora inquirer conf
npm install -D typescript @types/node
npm install @nouslabs/sdk

# Create basic structure
mkdir -p src/commands
touch src/cli.ts src/index.ts
```

### Core Implementation

**Priority commands:**
1. `nous auth login` - Authentication (all 4 methods)
2. `nous account balance` - Check balance
3. `nous account create` - Create new account
4. `nous send` - Send transaction
5. `nous tx history` - Transaction history

**Goal**: Working CLI published as @nouslabs/cli v1.0.0

---

## 📞 Communication Setup

### Email Setup (Required)

Create these email addresses:
- `hello@nouslabs.dev` - Main contact
- `support@nouslabs.dev` - Support queries
- `security@nouslabs.dev` - Security reports

**Option 1:** Use domain registrar's email forwarding  
**Option 2:** Use Google Workspace ($6/month)  
**Option 3:** Use Cloudflare Email Routing (free)

### Social Media (Optional but Recommended)

- [ ] Twitter/X: @nous_labs
- [ ] Discord: Create or join existing Qubic server
- [ ] Reddit: Participate in r/qubic
- [ ] LinkedIn: Nous Labs company page

---

## 🎨 Branding Assets (When Time Permits)

### Logo Design

Create a simple logo representing:
- Intelligence (nous = mind)
- Blockchain/technology
- Clean, modern aesthetic

**Colors suggestion:**
- Primary: Blue/Purple (intelligence, trust)
- Secondary: White/Gray
- Accent: Green (blockchain)

### Documentation Site

Current docs are functional, but consider:
- [ ] Custom domain
- [ ] Logo in header
- [ ] Favicon
- [ ] OG images for social sharing
- [ ] Custom color scheme

---

## 🔧 Technical Improvements (Not Urgent)

### SDK Enhancements

- [ ] Add comprehensive unit tests
- [ ] Add integration tests
- [ ] Improve error messages
- [ ] Add request caching
- [ ] Add retry logic
- [ ] WebSocket support

### Documentation

- [ ] Add video tutorials
- [ ] Add interactive playground
- [ ] Add more examples
- [ ] Add API auto-documentation
- [ ] Add search functionality

---

## 📊 Success Metrics

### Week 1
- [ ] Package published successfully
- [ ] 10+ npm downloads
- [ ] 1+ GitHub stars
- [ ] Documentation site live

### Month 1
- [ ] 100+ npm downloads
- [ ] 10+ GitHub stars
- [ ] CLI released
- [ ] 3+ community examples

### Month 3
- [ ] 1000+ npm downloads
- [ ] 50+ GitHub stars
- [ ] Active community
- [ ] Featured in Qubic ecosystem

---

## ⚠️ Common Pitfalls to Avoid

1. **Don't rush the first publish** - Test thoroughly first
2. **Check all URLs** - Make sure repository links are correct
3. **Test in clean environment** - Fresh npm install to verify
4. **Backup everything** - Keep copies before major changes
5. **Document breaking changes** - Clear migration guide is critical

---

## 🆘 If Something Goes Wrong

### Package publish fails
```bash
# Check npm login
npm whoami

# Verify organization access
npm org ls nous

# Check package name availability
npm view @nouslabs/sdk

# Try with verbose logging
npm publish --access public --verbose
```

### Version conflicts
```bash
# Unpublish if needed (within 72 hours only)
npm unpublish @nouslabs/sdk@2.0.0

# Fix version and republish
npm version 2.0.1
npm publish --access public
```

### Repository issues
- Contact GitHub support
- Check organization permissions
- Verify repository settings

---

## 📝 Quick Reference

**Package Name:** @nouslabs/sdk  
**CLI Name:** @nouslabs/cli  
**Organization:** Nous Labs  
**GitHub:** github.com/nous-labs  
**npm:** npmjs.com/org/nous  

**Current Version:** 1.4.0  
**Next Version:** 2.0.0 (major rebrand)  
**CLI Version:** 1.0.0 (initial release)

---

## 🎯 Today's Action Items

1. **Create GitHub org** (30 min)
2. **Create npm org** (15 min)
3. **Test locally** (30 min)
4. **Publish @nouslabs/sdk** (30 min)
5. **Update README** (already done ✓)
6. **Create release notes** (30 min)

**Total Time:** ~2.5 hours

---

**Last Updated:** January 26, 2025  
**Status:** Ready to execute  
**Priority:** High

Let's build something intelligent. 🧠