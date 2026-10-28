import { spawnSync } from 'child_process';
import path from 'path';

interface SuiteResult {
  file: string;
  status: 'PASS' | 'FAIL';
  exitCode: number;
  durationMs: number;
}

const testFiles = [
  'tests/e2e-persistence.test.tsx',
  'tests/profile-diff-and-patch.test.ts',
  'tests/reproduce-persistence-gaps.test.ts',
  'tests/profile-dirty.test.ts',
  'tests/mobile-save-and-visibility.test.ts',
  'tests/avatar-persistence.test.ts',
  'tests/section-visibility.test.ts',
  'tests/contact-and-revert-persistence.test.ts',
  'tests/oauth-and-stabilization.test.ts'
];

console.log('\n===============================================================');
console.log('   RUNNING ALL TEST SUITES (PERSISTENCE & REGRESSION SUITES)');
console.log('===============================================================\n');

const results: SuiteResult[] = [];

for (const testFile of testFiles) {
  const fullPath = path.resolve(process.cwd(), testFile);
  console.log(`\n>>> Executing suite: ${testFile}...`);
  const startTime = Date.now();

  const proc = spawnSync('npx', ['tsx', `"${testFile}"`], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  const durationMs = Date.now() - startTime;
  const exitCode = proc.status ?? (proc.error ? 1 : 0);
  const status: 'PASS' | 'FAIL' = exitCode === 0 ? 'PASS' : 'FAIL';

  results.push({
    file: testFile,
    status,
    exitCode,
    durationMs
  });
}

console.log('\n===============================================================');
console.log('                      TEST SUITE SUMMARY                       ');
console.log('===============================================================');

let hasFailures = false;
for (const r of results) {
  const icon = r.status === 'PASS' ? '✓ [PASS]' : '✗ [FAIL]';
  console.log(`${icon} ${r.file.padEnd(45)} (${(r.durationMs / 1000).toFixed(2)}s)`);
  if (r.status === 'FAIL') {
    hasFailures = true;
  }
}

console.log('===============================================================\n');

if (hasFailures) {
  console.error('One or more test suites failed.\n');
  process.exit(1);
} else {
  console.log('All test suites passed successfully!\n');
  process.exit(0);
}
