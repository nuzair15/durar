#!/usr/bin/env node
/**
 * sync-upstream.mjs
 * Checks for a new openclaw release on npm and bumps the durar version
 * to match. Run by GitHub Actions on a schedule.
 *
 * Logic:
 *   1. Fetch latest openclaw version from npm registry
 *   2. Compare with the version currently pinned in package.json
 *   3. If newer: update package.json dependency, bump durar patch version,
 *      write a CHANGELOG entry, and exit 0
 *   4. If same:  exit 0 with no changes (CI skips the release step)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join }                        from 'node:path'
import { fileURLToPath }               from 'node:url'

const __dir = fileURLToPath(new URL('.', import.meta.url))
const ROOT  = join(__dir, '..')

async function fetchLatestVersion (pkg) {
  const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`)
  if (!res.ok) throw new Error(`npm registry returned ${res.status} for ${pkg}`)
  const data = await res.json()
  return data.version
}

function bumpPatch (version) {
  const parts = version.split('.').map(Number)
  parts[2] = (parts[2] ?? 0) + 1
  return parts.join('.')
}

// ── Main ──────────────────────────────────────────────────────────────────────
const pkgPath = join(ROOT, 'package.json')
const pkg     = JSON.parse(readFileSync(pkgPath, 'utf8'))

console.log('Checking upstream openclaw version…')
const latestOpenclaw = await fetchLatestVersion('openclaw')
const currentPin     = pkg.dependencies?.openclaw?.replace(/[\^~>=<]*/g, '') ?? '0.0.0'

console.log(`  Current pin:    openclaw@${currentPin}`)
console.log(`  Latest upstream: openclaw@${latestOpenclaw}`)

if (latestOpenclaw === currentPin) {
  console.log('  ✓  Already up to date — no action needed.')
  // Signal to CI: nothing changed
  writeFileSync(join(ROOT, '.sync-result'), 'no-change')
  process.exit(0)
}

console.log(`  ↑  New upstream version — updating…`)

// Bump openclaw dependency
pkg.dependencies.openclaw = latestOpenclaw

// Bump durar patch version
const newDurarVersion = bumpPatch(pkg.version)
pkg.version = newDurarVersion

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
console.log(`  package.json updated: durar@${newDurarVersion}, openclaw@${latestOpenclaw}`)

// Append to CHANGELOG
const date = new Date().toISOString().slice(0, 10)
const entry = `\n## ${newDurarVersion} (${date})\n\n- Sync with openclaw@${latestOpenclaw}\n`
try {
  const changelogPath = join(ROOT, 'CHANGELOG.md')
  const existing = readFileSync(changelogPath, 'utf8')
  writeFileSync(changelogPath, existing + entry, 'utf8')
} catch {
  writeFileSync(join(ROOT, 'CHANGELOG.md'), `# Changelog\n${entry}`, 'utf8')
}

// Signal to CI: changes were made, proceed with publish
writeFileSync(join(ROOT, '.sync-result'), `new-version:${newDurarVersion}`)
console.log(`  ✅  Done. New durar version: ${newDurarVersion}`)
