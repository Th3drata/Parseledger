/**
 * M0 Go/No-Go gate runner.
 *
 * Usage: ANTHROPIC_API_KEY=... npm run gate -- <dir-of-statements>
 *
 * Runs every PDF/image in <dir> through extract() → reconcileStatement() and
 * reports the reconciliation pass-rate. Field accuracy needs the hand-checked
 * sample — this reports what can be measured automatically.
 */
import { readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { AnthropicExtractionProvider } from '../src/extraction';
import { reconcileStatement } from '../src/verification';
import { formatMinor } from '../src/money';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: npm run gate -- <dir-of-statements>');
  process.exit(1);
}

const SUPPORTED = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);
const files = (await readdir(dir)).filter((f) => SUPPORTED.has(extname(f).toLowerCase())).sort();
if (files.length === 0) {
  console.error(`no statements found in ${dir}`);
  process.exit(1);
}

const provider = new AnthropicExtractionProvider();
let passed = 0;
let failed = 0;

for (const file of files) {
  try {
    const stmt = await provider.extract({ filePath: join(dir, file) });
    const result = reconcileStatement(stmt);
    const tag = result.verified ? '✓ VERIFIED' : '✗ ISSUES  ';
    console.log(`${tag}  ${file}  [${stmt.bankName}] ${stmt.transactions.length} txns, closing ${formatMinor(stmt.closingBalanceMinor, stmt.currency)}`);
    for (const issue of result.issues) console.log(`             - ${issue.message}`);
    result.verified ? passed++ : failed++;
  } catch (err) {
    console.log(`✗ ERROR     ${file}  ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

const total = passed + failed;
console.log(`\nGate result: ${passed}/${total} statements reconcile (${Math.round((passed / total) * 100)}%)`);
