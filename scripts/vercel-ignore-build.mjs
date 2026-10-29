import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Only known non-web paths may skip a build. New or shared inputs build by default.
export function isNonWebPath(path) {
  return path.startsWith('apps/toss/')
    || path.startsWith('apps/mobile/')
    || path.startsWith('apps/desktop/')
    || path.startsWith('apps/toss-api/')
    || path.startsWith('docs/')
    || path.startsWith('content/quiz-encouragements/')
    || /^[^/]+\.md$/i.test(path);
}

export function decideBuild(previousSha, git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })) {
  if (!/^[a-f0-9]{40}$/i.test(previousSha ?? '') || /^0+$/.test(previousSha)) {
    return { skip: false, reason: 'No previous successful deployment; build.' };
  }
  try {
    // Compare every commit since the last successful deploy, including deletions
    // and both sides of renames. Never fall back to HEAD^ and miss earlier changes.
    git(['cat-file', '-e', `${previousSha}^{commit}`]);
    const paths = git(['diff', '--name-only', '--no-renames', '-z', previousSha, 'HEAD', '--'])
      .split('\0').filter(Boolean);
    const webChanges = paths.filter(path => !isNonWebPath(path));
    return webChanges.length
      ? { skip: false, reason: 'Web, shared, or unclassified files changed; build.' }
      : { skip: true, reason: 'Only non-web files changed (or no changes); skip web/PWA build.' };
  } catch {
    return { skip: false, reason: 'Git comparison unavailable; build to preserve web updates.' };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const decision = decideBuild(process.env.VERCEL_GIT_PREVIOUS_SHA);
  console.log(decision.reason);
  // Vercel's Ignored Build Step: 0 cancels, 1 continues the build.
  process.exitCode = decision.skip ? 0 : 1;
}
