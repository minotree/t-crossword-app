import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const files = [
  '.gitignore', 'AGENTS.md', 'PROJECT_STRUCTURE.md', 'crossword-project-spec.md', 'progress.md',
  'apps/toss-api/README.md', 'apps/toss-api/package.json', 'apps/toss-api/tsconfig.json',
  'apps/toss-api/Dockerfile', 'apps/toss-api/Dockerfile.dockerignore',
  'apps/toss-api/src/handler.ts', 'apps/toss-api/src/main.ts', 'apps/toss-api/src/tossAuth.ts',
  'apps/toss-api/src/authProbe.ts', 'apps/toss-api/src/edge.ts', 'apps/toss-api/src/edgeAdapter.ts',
  'apps/toss-api/src/requestLimit.ts', 'apps/toss-api/src/tossIdentity.ts', 'apps/toss-api/vite.edge.config.ts',
  'apps/toss-api/tests/handler.test.ts', 'apps/toss-api/tests/wallet.test.ts',
  'apps/toss-api/tests/authProbe.test.ts', 'apps/toss-api/tests/edgeAdapter.test.ts',
  'apps/toss-api/tests/puzzleProfile.test.ts', 'apps/toss-api/tests/requestLimit.test.ts', 'apps/toss-api/tests/roundCreation.test.ts',
  'apps/toss/.env.example', 'apps/toss/README.md', 'apps/toss/src/adapters/hintGateway.ts',
  'apps/toss/src/adapters/authProbe.ts', 'apps/toss/tests/authProbe.test.ts',
  'apps/toss/tests/hintGateway.test.ts', 'apps/toss/tests/hintsApp.test.tsx',
  'packages/data/src/supabaseClient.ts', 'packages/data/src/tossHintRepository.ts',
  'docs/decisions/20261018-toss-hint-api.md', 'docs/toss-api-deployment.md',
  'docs/toss-api-local-verification.md', 'docs/toss-free-hosting.md', 'docs/toss-round-idempotency.md',
  'docs/verification/toss-puzzle-profile-2026-10-19.json',
  'scripts/verify-toss-round-rollback.sql', 'scripts/verify-toss-round-schema.sql',
  'supabase/config.toml',
  'supabase/functions/toss-mtls-probe/index.ts', 'supabase/migrations/20261019_toss_round_idempotency.sql',
];
const forbidden = [
  /-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/=]{20}/,
  /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /\b(?:sb_secret_|sbp_)[A-Za-z0-9_-]{20,}/,
];
for (const path of files) {
  const source = readFileSync(path, 'utf8');
  if (forbidden.some((pattern) => pattern.test(source))) throw new Error(`Potential secret: ${path}`);
  if (/\.(?:pem|key|ait)$/.test(path) || path.startsWith('tmp/')) throw new Error(`Excluded file: ${path}`);
}
writeFileSync('tmp/api-commit-files.json', JSON.stringify(files, null, 2) + '\n');
console.log(`Reviewed ${files.length} explicit files; no private-key blocks, JWT values or known Supabase secret tokens found.`);
if (process.argv.includes('--stage')) {
  execFileSync('git', ['add', '--', ...files], { stdio: 'inherit' });
  execFileSync('git', ['diff', '--cached', '--check'], { stdio: 'inherit' });
  console.log(execFileSync('git', ['diff', '--cached', '--stat'], { encoding: 'utf8' }));
}
