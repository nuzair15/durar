#!/usr/bin/env node
/**
 * durar.mjs — Durar CLI entry point
 *
 * This is a transparent shim over the OpenClaw CLI.
 * It:
 *   1. Points the config directory at ~/.durar/ instead of ~/.openclaw/
 *   2. Rewrites any "openclaw" references in help/version output to "durar"
 *   3. Passes all arguments straight through to the openclaw binary
 *
 * Users run `durar <command>` — it behaves identically to `openclaw <command>`
 * but stores all config/data under ~/.durar/.
 */

import { spawn }       from 'node:child_process'
import { existsSync, mkdirSync, symlinkSync, readlinkSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { homedir }     from 'node:os'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// ── Resolve the real openclaw binary ────────────────────────────────────────
const require = createRequire(import.meta.url)
let openclawBin

try {
  // When installed as a dependency, openclaw's bin is resolvable from here
  const openclawPkg = require.resolve('openclaw/package.json')
  const openclawDir = resolve(openclawPkg, '..')
  openclawBin = join(openclawDir, 'openclaw.mjs')

  if (!existsSync(openclawBin)) {
    // Fallback: find it on PATH
    openclawBin = null
  }
} catch {
  openclawBin = null
}

if (!openclawBin) {
  // Last resort: assume openclaw is on PATH globally
  openclawBin = 'openclaw'
}

// ── Ensure ~/.durar/ config directory exists ─────────────────────────────────
const HOME        = homedir()
const DURAR_DIR   = join(HOME, '.durar')
const OPENCLAW_DIR = join(HOME, '.openclaw')

function ensureDurarDir () {
  if (!existsSync(DURAR_DIR)) {
    mkdirSync(DURAR_DIR, { recursive: true })
  }

  // If the user already has ~/.openclaw/ data, create a compatibility symlink
  // so ~/.durar/ → ~/.openclaw/ transparently until they run `durar migrate`
  // Only do this if ~/.durar is completely empty and ~/.openclaw exists
  if (existsSync(OPENCLAW_DIR)) {
    const files = ['openclaw.json', 'credentials', 'workspace']
    for (const f of files) {
      const durarPath   = join(DURAR_DIR, f)
      const openclawPath = join(OPENCLAW_DIR, f)
      if (!existsSync(durarPath) && existsSync(openclawPath)) {
        try {
          symlinkSync(openclawPath, durarPath)
        } catch {
          // Symlink already exists or no permission — skip
        }
      }
    }
  }
}

ensureDurarDir()

// ── Build the environment for the subprocess ─────────────────────────────────
// OpenClaw reads OPENCLAW_CONFIG_DIR when set — we point it at ~/.durar/
// (this env var was added in openclaw v1.x — falls back gracefully if absent)
const env = {
  ...process.env,
  OPENCLAW_CONFIG_DIR: DURAR_DIR,
  OPENCLAW_DATA_DIR:   DURAR_DIR,
  // Keep DURAR_DIR available for any durar-specific tooling
  DURAR_CONFIG_DIR:    DURAR_DIR,
}

// ── Intercept --version to show durar version too ────────────────────────────
const args = process.argv.slice(2)
if (args[0] === '--version' || args[0] === '-v') {
  const { createRequire: cr } = await import('node:module')
  const r = cr(import.meta.url)
  const durarVersion = r('./package.json').version
  let openclawVersion = 'unknown'
  try {
    openclawVersion = r('openclaw/package.json').version
  } catch {}
  console.log(`durar/${durarVersion} (openclaw/${openclawVersion}) node/${process.version}`)
  process.exit(0)
}

// ── Spawn openclaw with all args ──────────────────────────────────────────────
const isDirectMjs = openclawBin.endsWith('.mjs')

const child = isDirectMjs
  ? spawn(process.execPath, [openclawBin, ...args], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env,
    })
  : spawn(openclawBin, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      env,
      shell: false,
    })

// Rewrite "openclaw" → "durar" in stdout/stderr so help text shows "durar"
function rewrite (chunk) {
  return chunk
    .toString()
    .replace(/openclaw/gi, m => m === 'OPENCLAW' ? 'DURAR' : m[0] === 'O' ? 'Durar' : 'durar')
}

child.stdout.on('data', d => process.stdout.write(rewrite(d)))
child.stderr.on('data', d => process.stderr.write(rewrite(d)))

child.on('error', err => {
  if (err.code === 'ENOENT') {
    console.error(
      'durar: could not find the openclaw binary.\n' +
      'Run: npm install -g openclaw   (or reinstall durar)\n'
    )
  } else {
    console.error('durar: unexpected error:', err.message)
  }
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 0)
  }
})
