#!/usr/bin/env node
/**
 * match-symptom.js
 *
 * Deterministic symptom matcher for the IBM i Developer Detective workflow.
 * No AI, no fuzzy logic, no external dependencies.
 *
 * Usage:
 *   node src/match-symptom.js < diagnostics.json
 *   node src/run-diagnostics.js | node src/match-symptom.js
 *
 * Input:  IBM i diagnostic JSON (from run-diagnostics.js) on stdin
 * Output: Match result JSON on stdout
 *
 * Output shape (match found):
 * {
 *   "matched": true,
 *   "confidence_score": 83,
 *   "confidence_band": "high",
 *   "suggest_github_issue": true,
 *   "issue": { ...registry entry... }
 * }
 *
 * Output shape (no match):
 * {
 *   "matched": false,
 *   "suggest_github_issue": true
 * }
 *
 * Confidence bands:
 *   75–100 → "high"   — self-service resolution likely; offer GitHub issue anyway
 *   40–74  → "medium" — try resolution steps; raise issue if unresolved
 *   1–39   → "low"    — open-ended AI analysis recommended; raise GitHub issue
 *   0      → no match
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, 'known-issues.json');
const registry     = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

function confidenceBand(score) {
  if (score >= 75) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function matchAgainstRegistry(diagnosticText) {
  let bestMatch = null;
  let bestScore = 0;

  for (const issue of registry) {
    const symptoms = issue.symptoms;
    if (!symptoms || symptoms.length === 0) continue;

    const matched = symptoms.filter(s =>
      diagnosticText.includes(s.toLowerCase())
    );

    if (matched.length === 0) continue;

    const score = Math.round((matched.length / symptoms.length) * 100);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { issue, matchedKeywords: matched, score };
    }
  }

  return bestMatch;
}

// Read diagnostic JSON from stdin
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let diagnostics;
  try {
    diagnostics = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`Invalid diagnostic JSON on stdin: ${err.message}\n`);
    process.exit(1);
  }

  // Stringify the entire diagnostic object for substring matching
  const diagnosticText = JSON.stringify(diagnostics).toLowerCase();

  const result = matchAgainstRegistry(diagnosticText);

  if (!result) {
    process.stdout.write(JSON.stringify({
      matched: false,
      suggest_github_issue: true
    }, null, 2));
    process.exit(0);
  }

  const band = confidenceBand(result.score);

  process.stdout.write(JSON.stringify({
    matched: true,
    confidence_score: result.score,
    confidence_band: band,
    matched_keywords: result.matchedKeywords,
    suggest_github_issue: true,
    issue: result.issue
  }, null, 2));
  process.exit(0);
});
