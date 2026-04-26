# GitHub Setup for Auto-Updates - Step by Step

## ✅ What We've Done So Far

1. ✅ Installed `electron-updater`
2. ✅ Updated `package.json` with repository config
3. ✅ Added auto-updater code to `electron/main.js`
4. ✅ Created update notification UI (`public/update-handler.js`)

---

## 📋 What You Need to Do Next

### Step 1: Create GitHub Account (if you don't have one)

1. Go to https://github.com
2. Click "Sign up"
3. Enter your email, create password
4. Verify your email
5. Done! (Takes 2 minutes)

---

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `mokha-film-suite`
   - **Description**: "MOKHA FILM Suite - Professional AI Film Prompt Builder"
   - **Visibility**: ✅ Public (required for free releases)
3. Click "Create repository"
4. **Copy your GitHub username** (you'll need it next)

---

### Step 3: Update package.json with Your Username

Open `package.json` and replace `YOUR_USERNAME` with your actual GitHub username in TWO places:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/mokha-film-suite.git"
},
```

AND

```json
"publish": [
  {
    "provider": "github",
    "owner": "YOUR_USERNAME",
    "repo": "mokha-film-suite"
  }
],
```

---

### Step 4: Generate GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Fill in:
   - **Note**: "MOKHA Release Token"
   - **Expiration**: No expiration (or 1 year)
   - **Scopes**: Check ✅ `repo` (all repo permissions)
4. Click "Generate token"
5. **COPY THE TOKEN** (you won't see it again!)

---

### Step 5: Set Environment Variable

**Windows (PowerShell):**
```powershell
setx GH_TOKEN "paste_your_token_here"
```

**IMPORTANT:** Close and reopen your terminal after this!

---

### Step 6: Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit - MOKHA FILM Suite v2.11.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mokha-film-suite.git
git push -u origin main
```

---

### Step 7: Build and Publish First Release

```bash
# Build the app
npm run build-win

# Publish to GitHub
npx electron-builder --win --publish always
```

This will:
1. Build your installer
2. Create a GitHub Release (v2.11.0)
3. Upload the installer
4. Generate update files

---

### Step 8: Test Auto-Update

1. Install the app from the installer
2. Update version in `package.json` to `2.12.0`
3. Build and publish again:
   ```bash
   npm run build-win
   npx electron-builder --win --publish always
   ```
4. Open the installed app
5. Wait 5 seconds
6. You should see update notification! 🎉

---

## 🎯 Future Updates (Easy!)

When you want to release a new version:

1. Update version in `package.json`:
   ```json
   "version": "2.13.0"
   ```

2. Build and publish:
   ```bash
   npm run build-win
   npx electron-builder --win --publish always
   ```

3. Done! All users get notified automatically.

---

## 💰 Cost

**Everything is 100% FREE:**
- ✅ GitHub account: FREE
- ✅ GitHub Releases: FREE
- ✅ Unlimited downloads: FREE
- ✅ Bandwidth: FREE (GitHub CDN)
- ✅ electron-updater: FREE

**Total: $0/month forever!**

---

## 🆘 Troubleshooting

### "GH_TOKEN not found"
- Make sure you set the environment variable
- Close and reopen your terminal
- Try: `echo $env:GH_TOKEN` (should show your token)

### "Repository not found"
- Check your GitHub username in package.json
- Make sure repository is Public
- Verify you pushed code to GitHub

### "Update not detected"
- Make sure you're running the installed app (not dev mode)
- Check version number increased
- Wait 5-10 seconds after app starts

---

## 📞 Need Help?

Tell me:
1. Your GitHub username (once you create it)
2. Any error messages you see
3. Which step you're stuck on

I'll help you through it!

---

**Ready?** Start with Step 1 (create GitHub account) and let me know when you're done!
