#!/usr/bin/env node
/**
 * postinstall.mjs
 * Runs automatically after `npm install -g durar`.
 * Creates ~/.durar/ and prints a friendly welcome message.
 */

import { mkdirSync, existsSync } from 'node:fs'
import { join }                  from 'node:path'
import { homedir }               from 'node:os'

const HOME      = homedir()
const DURAR_DIR = join(HOME, '.durar')
const OC_DIR    = join(HOME, '.openclaw')

// Create config dir silently
try {
  mkdirSync(DURAR_DIR, { recursive: true })
} catch {}

const hasExisting = existsSync(OC_DIR)

console.log(`
  💎  Durar installed successfully!

  Config directory:  ${DURAR_DIR}
  Run:               durar onboard

${hasExisting
  ? `  Existing OpenClaw data detected at ${OC_DIR}
  Run:  durar migrate   to move your config to ~/.durar/\n`
  : ''}  Docs: https://github.com/durar-app/durar
`)
