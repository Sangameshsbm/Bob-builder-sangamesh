#!/usr/bin/env node
/**
 * collect-diagnostics.js
 *
 * Collects Code for IBM i extension diagnostic data from the local filesystem.
 * IDE-agnostic — works identically when called from Bob or VS Code (Copilot/Claude).
 * No IBM i connection required. No system queries. Extension-side data only.
 *
 * Mock mode (IBM_I_MOCK=true):
 *   Returns pre-built mock extension log data.
 *   Scenario selected by IBM_I_MOCK_SCENARIO env var:
 *     "mapepire-hang" → mock-extension-logs-mapepire-hang.json  (default)
 *     "port449"       → mock-extension-logs-port449.json
 *
 * Live mode:
 *   Reads Code for IBM i extension logs from standard VS Code log locations.
 *   Returns a structured JSON object with extension version, VS Code version,
 *   connection trace, and output channel log content.
 *
 * Output shape (both modes):
 * {
 *   "collected_at": "<ISO timestamp>",
 *   "collection_mode": "mock" | "live",
 *   "vscode_version": "<string>",
 *   "extension_version": "<string>",
 *   "platform": "<string>",
 *   "output_log": "<full text of Code for IBM i output channel log>",
 *   "connection_trace": "<connection trace text if available>",
 *   "error_summary": ["<key error line>", ...]
 * }
 *
 * Exit codes: 0 success, 1 failure
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const isMock   = process.env.IBM_I_MOCK === 'true';
const scenario = (process.env.IBM_I_MOCK_SCENARIO || 'mapepire-hang').toLowerCase();

if (isMock) {
  // ── Mock mode ──────────────────────────────────────────────────────────────
  const mockFiles = {
    'mapepire-hang': path.join(__dirname, 'mock-extension-logs-mapepire-hang.json'),
    'port449':       path.join(__dirname, 'mock-extension-logs-port449.json'),
  };

  const mockFile = mockFiles[scenario];
  if (!mockFile) {
    process.stderr.write(`Unknown IBM_I_MOCK_SCENARIO "${scenario}". Valid values: mapepire-hang, port449\n`);
    process.exit(1);
  }

  try {
    process.stdout.write(fs.readFileSync(mockFile, 'utf8'));
    process.exit(0);
  } catch (err) {
    process.stderr.write(`Failed to read mock file ${mockFile}: ${err.message}\n`);
    process.exit(1);
  }

} else {
  // ── Live mode ──────────────────────────────────────────────────────────────
  // Reads Code for IBM i extension logs from standard VS Code log directories.
  // These are filesystem reads — no VS Code API or IBM i connection required.

  const platform = os.platform();
  const homeDir  = os.homedir();

  const logRoots = {
    win32:  path.join(homeDir, 'AppData', 'Roaming', 'Code', 'logs'),
    darwin: path.join(homeDir, 'Library', 'Application Support', 'Code', 'logs'),
    linux:  path.join(homeDir, '.config', 'Code', 'logs'),
  };

  const logRoot = logRoots[platform] || logRoots['linux'];

  let outputLog       = 'Log file not found — check VS Code Output > Code for IBM i manually';
  let connectionTrace = 'Connection trace not available';

  try {
    if (fs.existsSync(logRoot)) {
      const sessions = fs.readdirSync(logRoot).sort().reverse(); // most recent first
      for (const session of sessions) {
        const extLogDir = path.join(logRoot, session, 'exthost');
        if (!fs.existsSync(extLogDir)) continue;
        const logFiles = fs.readdirSync(extLogDir)
          .filter(f => f.toLowerCase().includes('halcyon') || f.toLowerCase().includes('codefori'));
        if (logFiles.length > 0) {
          outputLog = fs.readFileSync(path.join(extLogDir, logFiles[0]), 'utf8').slice(-8000);
          break;
        }
      }
    }
  } catch (_) { /* non-fatal */ }

  const result = {
    collected_at:      new Date().toISOString(),
    collection_mode:   'live',
    vscode_version:    process.env.VSCODE_VERSION || 'unknown',
    extension_version: process.env.CODEFORI_VERSION || 'unknown',
    platform,
    output_log:        outputLog,
    connection_trace:  connectionTrace,
    error_summary:     outputLog
      .split('\n')
      .filter(l => /error|warn|fail|exception|timeout|MSGW|MCH/i.test(l))
      .slice(0, 20),
  };

  process.stdout.write(JSON.stringify(result, null, 2));
  process.exit(0);
}
