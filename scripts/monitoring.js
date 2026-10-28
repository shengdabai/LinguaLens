#!/usr/bin/env node
/**
 * monitoring.js — Simple health check and metrics reporter for LinguaLens
 * Runs as a cron-compatible health monitor for Docker deployments.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const LOG_FILE = path.join(process.cwd(), 'health.log');

function checkHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${PORT}`, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          size: body.length,
          timestamp: new Date().toISOString(),
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });
  });
}

async function main() {
  try {
    const result = await checkHealth();
    const log = `[${result.timestamp}] ✅ Status: ${result.status}, Size: ${result.size} bytes\n`;
    process.stdout.write(log);
    fs.appendFileSync(LOG_FILE, log);
    process.exit(0);
  } catch (err) {
    const log = `[${new Date().toISOString()}] ❌ Health check failed: ${err.message}\n`;
    process.stderr.write(log);
    fs.appendFileSync(LOG_FILE, log);
    process.exit(1);
  }
}

main();
