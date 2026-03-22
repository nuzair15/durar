#!/usr/bin/env node
/**
 * migrate.mjs
 * Migrates an existing ~/.openclaw/ installation to ~/.durar/.
 *
 * Usage:  durar migrate
 *         node scripts/migrate.mjs
 *
 * What it does:
 *   1. Copies ~/.openclaw/ → ~/.durar/  (non-destructive)
 *   2. Rewrites any "openclaw" string inside config files to "durar"
 *      where safe to do so (display strings, not API keys/paths)
 *   3. Leaves ~/.openclaw/ in place so openclaw CLI still works
 *   4. Reports what was migrated
 */

import {
  existsSync, mkdirSync, readdirSync, statSync,
  copyFileSync, readFileSync, writeFileSync,
} from 'node:fs'
import { join, relative }  from 'node:path'
import { homedir }          from 'node:os'

const HOME      = homedir()
const SRC       = join(HOME, '.openclaw')
const DEST      = join(HOME, '.durar')

// Files where string substitution is safe
const TEXT_EXTENSIONS = new Set(['.json', '.md', '.txt', '.yaml', '.yml', '.toml', '.env'])
// Files/dirs to skip entirely
const SKIP = new Set(['.git', 'node_modules', '.DS_Store'])

let copied = 0
let skipped = 0

function copyDir (src, dest) {
  if (!existsSync(src)) return
  mkdirSync(dest, { recursive: true })

  for (const entry of readdirSync(src)) {
    if (SKIP.has(entry)) { skipped++; continue }

    const srcPath  = join(src, entry)
    const destPath = join(dest, entry)
    const stat     = statSync(srcPath)

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      if (existsSync(destPath)) {
        skipped++
        continue   // never overwrite — migrate is non-destructive
      }

      const ext = entry.slice(entry.lastIndexOf('.'))
      if (TEXT_EXTENSIONS.has(ext)) {
        // Safe to rewrite display strings
        let content = readFileSync(srcPath, 'utf8')
        // Only rewrite display/label strings, not paths or identifiers
        // that would break functionality
        content = content
          .replace(/"name"\s*:\s*"OpenClaw"/g, '"name": "Durar"')
          .replace(/"app_name"\s*:\s*"openclaw"/g, '"app_name": "durar"')
        writeFileSync(destPath, content, 'utf8')
      } else {
        copyFileSync(srcPath, destPath)
      }
      copied++
      console.log(`  ✓  ${relative(HOME, destPath)}`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

if (!existsSync(SRC)) {
  console.log(`  ℹ  No existing ~/.openclaw/ found — nothing to migrate.\n`)
  process.exit(0)
}

console.log(`\n  💎  Durar — migrating config\n`)
console.log(`  From:  ${SRC}`)
console.log(`  To:    ${DEST}\n`)

copyDir(SRC, DEST)

console.log(`
  ✅  Migration complete
      ${copied}  files copied
      ${skipped} files skipped (already exist or excluded)

  Your original ~/.openclaw/ was not modified.
  Both 'openclaw' and 'durar' commands will continue to work.

  To verify:  durar doctor
`)
