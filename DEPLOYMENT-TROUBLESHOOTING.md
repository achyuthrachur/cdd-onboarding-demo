# Deployment Troubleshooting Guide

## Issue: Changes Not Visible on Deployed Site

If you've deployed changes but they're not appearing on the live site, follow these steps:

### 1. Clear Local Build Cache
```bash
# Delete .next directory and rebuild
npm run build:clean
```

### 2. Verify Your Changes Are Committed
```bash
git status
git log -1  # Check the latest commit
```

### 3. Force Push to Trigger New Deployment
```bash
# Make a small change to force rebuild
git commit --allow-empty -m "chore: force rebuild"
git push origin main
```

### 4. Check Vercel Deployment
- Visit https://vercel.com/dashboard
- Check the deployment logs
- Verify the build completed successfully
- Check the "Source" tab to confirm the correct commit was deployed

### 5. Clear Browser Cache (IMPORTANT!)
Even with cache-busting headers, you may need to manually clear cache:

**Chrome/Edge:**
- Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Firefox:**
- Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Safari:**
- Mac: `Cmd + Option + R`

**Nuclear Option - Full Cache Clear:**
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### 6. Check Deployment URL Directly
Sometimes the custom domain has additional caching. Try:
- The Vercel deployment URL (e.g., `your-app-xyz123.vercel.app`)
- Add `?v=[timestamp]` to the URL to bypass cache
- Open in incognito/private browsing mode

### 7. Verify CSS is Actually Updated
1. Open DevTools (F12)
2. Go to Sources tab
3. Find `globals.css` or your CSS files
4. Check if the changes are present in the source

### 8. Check for Build Errors
```bash
# Run a local build to check for errors
npm run build

# If there are TypeScript errors, they may be blocking the deployment
npm run build 2>&1 | tee build.log
```

## Current Cache Strategy

This project uses a smart caching strategy:

- **Static assets** (JS, CSS, images, fonts): Cached for 1 year (immutable)
- **HTML pages**: No cache (always fresh)
- **API routes**: No cache (always fresh)

This is configured in `vercel.json` and `next.config.ts`.

## Build ID System

The project uses timestamp-based build IDs to ensure each deployment is unique:
```typescript
generateBuildId: async () => {
  return `build-${Date.now()}`;
}
```

This forces Next.js to generate new hashed filenames for each build, bypassing stale caches.

## Emergency: Nuclear Option

If nothing else works, force a complete rebuild:

```bash
# 1. Delete all cache directories
rm -rf .next
rm -rf node_modules/.cache
rm -rf .vercel

# 2. Reinstall dependencies
npm install

# 3. Build locally to verify
npm run build

# 4. Force commit and push
git add .
git commit -m "chore: force rebuild - cache bust"
git push origin main --force-with-lease

# 5. In Vercel dashboard, manually trigger a redeploy
# Visit: https://vercel.com/[your-project]/deployments
# Click "..." menu on latest deployment
# Select "Redeploy"
```

## Verifying Fixes Are Live

### Check Specific Fix:
1. **Dark mode text contrast:**
   - Toggle dark mode
   - Check if text is visible on dark backgrounds
   - Verify utility classes like `.text-heading` work

2. **FLU extraction results:**
   - Go to FLU Extraction page
   - Check if results persist on navigation
   - Verify data shows immediately on return

3. **Stage data persistence:**
   - Complete a stage
   - Close browser
   - Reopen and verify data is still there

### CSS Variables Check:
Open DevTools Console and run:
```javascript
// Check if dark mode CSS variables are loaded
const root = document.documentElement;
const bgColor = getComputedStyle(root).getPropertyValue('--text-primary');
console.log('--text-primary:', bgColor);

// Should show #ffffff in dark mode, #333333 in light mode
```

## Still Not Working?

If you've tried everything:
1. Check Vercel deployment logs for build errors
2. Verify the correct branch is set as production in Vercel
3. Check if there are environment variable issues
4. Try deploying to a new Vercel project as a test
5. Check if there's a CDN or proxy between you and Vercel (corporate network, VPN)

## Useful Commands

```bash
# Check current deployment
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Pull environment variables
vercel env pull

# Force a clean reinstall and build
rm -rf node_modules .next && npm install && npm run build
```

## Prevention

To avoid this in the future:
1. Always test changes locally with `npm run build` before deploying
2. Use feature branches and preview deployments
3. Clear cache immediately after each deployment
4. Use incognito mode for testing deployments
5. Check Vercel deployment logs for successful builds
