#!/usr/bin/env node
/**
 * run-diagnostics.js
 *
 * Collects IBM i diagnostic data for the Developer Detective workflow.
 *
 * Mock mode  (IBM_I_MOCK=true):
 *   Reads the appropriate pre-built mock file and prints it to stdout.
 *   No IBM i connection required — safe for offline demos.
 *   Scenario is selected by IBM_I_MOCK_SCENARIO env var:
 *     "port449" → src/mock-diagnostics-port449.json
 *     "3239"    → src/mock-diagnostics-3239.json  (default)
 *
 * Live mode (IBM_I_MOCK not set or false):
 *   Emits a { mode: "live", queries: [...] } JSON object to stdout.
 *   The calling agent (Bob via execute_sql_statement, or Copilot/Claude
 *   via its own MCP tools) executes each query and merges the results
 *   back into the diagnostic JSON shape expected by match-symptom.js.
 *
 * Exit codes:
 *   0 — success
 *   1 — mock file not found or unreadable
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const isMock   = process.env.IBM_I_MOCK === 'true';
const scenario = (process.env.IBM_I_MOCK_SCENARIO || '3239').toLowerCase();

if (isMock) {
  // ── Mock mode ──────────────────────────────────────────────────────────────
  const mockFiles = {
    'port449': path.join(__dirname, 'mock-diagnostics-port449.json'),
    '3239':    path.join(__dirname, 'mock-diagnostics-3239.json'),
  };

  const mockFile = mockFiles[scenario];
  if (!mockFile) {
    process.stderr.write(`Unknown IBM_I_MOCK_SCENARIO "${scenario}". Valid values: port449, 3239\n`);
    process.exit(1);
  }

  try {
    const data = fs.readFileSync(mockFile, 'utf8');
    process.stdout.write(data);
    process.exit(0);
  } catch (err) {
    process.stderr.write(`Failed to read mock file ${mockFile}: ${err.message}\n`);
    process.exit(1);
  }

} else {
  // ── Live mode ──────────────────────────────────────────────────────────────
  // Emit a structured list of SQL queries for the calling agent to execute.
  // The agent (Bob or VS Code Copilot/Claude) runs each query via its IBM i
  // MCP tool (execute_sql_statement) and assembles the results into the
  // same JSON shape as the mock files before passing to match-symptom.js.
  const livePayload = {
    mode: 'live',
    system: process.env.IBM_I_HOST || 'UNKNOWN',
    instructions: [
      'Execute each query in the queries array using execute_sql_statement.',
      'Collect all result rows.',
      'Build a diagnostics object with these fields: system_name, collected_at, mapepire_version, jobs, log_entries.',
      '  - jobs: rows from query index 0 (ACTIVE_JOB_INFO)',
      '  - log_entries: rows from query index 1 (JOBLOG_INFO)',
      '  - mapepire_version: scalar from query index 2',
      'Pass the assembled diagnostics object to match-symptom.js via stdin.'
    ],
    queries: [
      {
        index: 0,
        label: 'active_mapepire_jobs',
        sql: "SELECT JOB_NAME, JOB_NUMBER, JOB_USER, JOB_STATUS, JOB_TYPE, SUBSYSTEM, CPU_TIME_USED, ELAPSED_TIME, FUNCTION FROM TABLE(QSYS2.ACTIVE_JOB_INFO()) WHERE JOB_NAME LIKE '%NOXDB%'"
      },
      {
        index: 1,
        label: 'mapepire_job_log',
        sql: "SELECT MESSAGE_TIMESTAMP, MESSAGE_ID, SEVERITY, MESSAGE_TEXT, FROM_PROGRAM FROM TABLE(QSYS2.JOBLOG_INFO('*')) WHERE MESSAGE_TEXT LIKE '%Mapepire%' OR MESSAGE_TEXT LIKE '%NOXDB%' ORDER BY MESSAGE_TIMESTAMP DESC FETCH FIRST 20 ROWS ONLY"
      },
      {
        index: 2,
        label: 'mapepire_version',
        sql: "SELECT LONG_COMMENT FROM QSYS2.SYSROUTINES WHERE ROUTINE_SCHEMA = 'QGPL' AND ROUTINE_NAME = 'NOXDBSRV' FETCH FIRST 1 ROW ONLY"
      }
    ]
  };

  process.stdout.write(JSON.stringify(livePayload, null, 2));
  process.exit(0);
}
