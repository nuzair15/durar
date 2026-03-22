# Publishing Durar to npm — Step by Step

Follow these steps exactly once. After that, everything runs automatically.

---

## Prerequisites

- Node.js 20+ installed
- A GitHub account
- An npm account (free at npmjs.com)
- Git installed

---

## Step 1 — Create npm account and get a token

1. Go to **https://www.npmjs.com/signup** and create a free account
2. Verify your email
3. Go to **https://www.npmjs.com/settings/YOUR_USERNAME/tokens**
4. Click **Generate New Token** → **Granular Access Token**
5. Set:
   - Token name: `durar-publish`
   - Expiration: 365 days (or no expiry)
   - Permissions: **Read and write**
   - Packages: **All packages**
6. Click **Generate Token** — copy it, you won't see it again

---

## Step 2 — Create the GitHub repository

1. Go to **https://github.com/new**
2. Repository name: `durar`
3. Owner: your account or org (e.g. `durar-app`)
4. Set to **Public** (required for free npm provenance)
5. Do NOT initialise with README (we'll push our own)
6. Click **Create repository**

---

## Step 3 — Add the NPM_TOKEN secret to GitHub

1. In your new repo, go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: paste the token from Step 1
5. Click **Add secret**

---

## Step 4 — Push the durar-cli files

```bash
# From wherever you downloaded/unzipped the durar-cli package:
cd durar-cli

# Initialise git
git init
git add .
git commit -m "chore: initial durar release"

# Point to your GitHub repo (replace with your actual URL)
git remote add origin https://github.com/durar-app/durar.git

# Push
git branch -M main
git push -u origin main
```

---

## Step 5 — Publish the first version manually

```bash
# Login to npm
npm login
# (enter your npm username, password, and OTP if 2FA is enabled)

# Install deps locally
npm install

# Publish
npm publish --access public
```

You should see:
```
+ durar@1.0.0
```

Visit **https://www.npmjs.com/package/durar** to confirm it's live.

---

## Step 6 — Test the install

In a fresh terminal:

```bash
npm install -g durar
durar --version
# → durar/1.0.0 (openclaw/X.X.X) node/vXX.X.X
```

---

## Step 7 — Verify auto-sync is working

1. Go to your GitHub repo → **Actions** tab
2. You should see the **Sync Upstream & Publish** workflow
3. Click **Run workflow** → **Run workflow** to trigger it manually once
4. It will check if openclaw has a newer version than what's in your package.json
5. If yes, it bumps the version, commits, tags, and publishes to npm automatically
6. After that first manual trigger, it runs every 6 hours on its own

---

## Step 8 — Point the Durar GUI at your package

In the Durar GUI (`durar/app/app.py`), the install command is already set to:
```
npm install -g durar@latest
```

So as soon as your package is live on npm, the GUI's install button will
download and install your published `durar` package.

---

## What happens automatically from here

| Trigger | Action |
|---|---|
| Every 6 hours | Checks `openclaw` latest version on npm |
| New openclaw version found | Bumps `durar` patch version, commits, tags, publishes |
| No new version | Does nothing |
| You push a `v*.*.*` tag | Publishes that exact version immediately |

---

## Updating manually

If you want to release a specific version:

```bash
# Edit package.json version manually, e.g. "version": "1.2.0"
git add package.json
git commit -m "chore: release 1.2.0"
git tag v1.2.0
git push origin main --tags
# GitHub Actions will publish to npm automatically
```

---

## Troubleshooting

**`npm publish` says "you must be logged in"**
Run `npm login` first.

**`npm publish` says "package name already taken"**
The name `durar` may already be on npm. Try `durar-cli` or `@yourusername/durar`
and update the `"name"` field in `package.json` to match.

**GitHub Actions fails with "npm ERR! 403"**
Your `NPM_TOKEN` secret is wrong or expired. Regenerate it on npmjs.com
and update the GitHub secret.

**`durar` command not found after install**
Check that npm's global bin directory is in your PATH:
```bash
npm bin -g        # shows the global bin directory
echo $PATH        # check it's included
```
On macOS with nvm, you may need to add `~/.nvm/versions/node/vXX/bin` to PATH.
