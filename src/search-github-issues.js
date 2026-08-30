#!/usr/bin/env node
/**
 * search-github-issues.js
 *
 * Searches codefori/vscode-ibmi GitHub issues for matches to the developer's symptom.
 * IDE-agnostic — works identically when called from Bob or VS Code (Copilot/Claude).
 *
 * Mock mode (IBM_I_MOCK=true):
 *   Returns pre-built mock GitHub API response from src/mock-github-issues.json.
 *   No internet or GitHub PAT required — safe for offline demos.
 *
 * Live mode:
 *   Calls GitHub Search API:
 *     GET https://api.github.com/search/issues
 *         ?q=<symptom>+repo:codefori/vscode-ibmi
 *   GITHUB_TOKEN env var recommended for higher rate limits (5000 req/hr vs 60).
 *
 * Input:  symptom keywords as CLI args
 *         e.g. node src/search-github-issues.js "Starting Mapepire stuck upgrade"
 *
 * Output shape:
 * {
 *   "search_mode": "mock" | "live",
 *   "query": "<query used>",
 *   "total_count": 2,
 *   "issues": [
 *     {
 *       "number": 3239,
 *       "title": "...",
 *       "state": "open" | "closed",
 *       "url": "https://github.com/codefori/vscode-ibmi/issues/3239",
 *       "created_at": "...",
 *       "updated_at": "...",
 *       "labels": ["bug", "mapepire"],
 *       "body_excerpt": "<first 500 chars of issue body>",
 *       "comments": 14
 *     }
 *   ]
 * }
 *
 * Exit codes: 0 success, 1 failure
 */

'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const isMock  = process.env.IBM_I_MOCK === 'true';
const symptom = process.argv.slice(2).join(' ') || process.env.SYMPTOM || '';

if (isMock) {
  // ── Mock mode ──────────────────────────────────────────────────────────────
  const mockFile = path.join(__dirname, 'mock-github-issues.json');
  try {
    process.stdout.write(fs.readFileSync(mockFile, 'utf8'));
    process.exit(0);
  } catch (err) {
    process.stderr.write(`Failed to read mock file: ${err.message}\n`);
    process.exit(1);
  }
}

if (!symptom) {
  process.stderr.write('Usage: node src/search-github-issues.js "<symptom keywords>"\n');
  process.exit(1);
}

// ── Live mode ────────────────────────────────────────────────────────────────
const query   = encodeURIComponent(`${symptom} repo:codefori/vscode-ibmi`);
const token   = process.env.GITHUB_TOKEN || '';
const headers = {
  'User-Agent': 'code-for-i-detective/1.0',
  'Accept':     'application/vnd.github+json',
};
if (token) headers['Authorization'] = `Bearer ${token}`;

const options = {
  hostname: 'api.github.com',
  path:     `/search/issues?q=${query}&per_page=5&sort=relevance`,
  method:   'GET',
  headers,
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    if (res.statusCode !== 200) {
      process.stderr.write(`GitHub API returned ${res.statusCode}: ${body}\n`);
      process.exit(1);
    }
    try {
      const data = JSON.parse(body);
      const result = {
        search_mode: 'live',
        query:       symptom,
        total_count: data.total_count,
        issues: (data.items || []).map(issue => ({
          number:       issue.number,
          title:        issue.title,
          state:        issue.state,
          url:          issue.html_url,
          created_at:   issue.created_at,
          updated_at:   issue.updated_at,
          labels:       (issue.labels || []).map(l => l.name),
          body_excerpt: (issue.body || '').slice(0, 500),
          comments:     issue.comments,
        })),
      };
      process.stdout.write(JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (err) {
      process.stderr.write(`Failed to parse GitHub API response: ${err.message}\n`);
      process.exit(1);
    }
  });
});

req.on('error', err => {
  process.stderr.write(`GitHub API request failed: ${err.message}\n`);
  process.exit(1);
});
req.end();
