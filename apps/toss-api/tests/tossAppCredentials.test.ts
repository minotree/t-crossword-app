import { describe, expect, it } from 'vitest';
import { tossAppCredentials } from '../src/tossAppCredentials.js';

describe('app-specific mTLS credentials', () => {
  it('preserves old credentials and identity while isolating the new app', () => {
    const oldApp = tossAppCredentials('https://t-crossword.private-apps.tossmini.com');
    const newApp = tossAppCredentials('https://english-words.private-apps.tossmini.com');
    expect(oldApp).toEqual({ cert: 'TOSS_MTLS_CERT_PEM', key: 'TOSS_MTLS_KEY_PEM', identityPrefix: '' });
    expect(newApp).toEqual({ cert: 'TOSS_ENGLISH_WORDS_MTLS_CERT_PEM', key: 'TOSS_ENGLISH_WORDS_MTLS_KEY_PEM', identityPrefix: 'english-words:' });
  });
  it('uses the same new-app identity and certificate for production and console tests', () => {
    expect(tossAppCredentials('https://english-words.apps.tossmini.com')).toEqual(
      tossAppCredentials('https://english-words.private-apps.tossmini.com'),
    );
  });
  it.each([null, 'https://not-allowed.example', 'https://english-words.private-apps.tossmini.com.evil.example', 'https://english-words.apps.tossmini.com.evil.example', 'http://english-words.apps.tossmini.com', 'https://other-app.apps.tossmini.com'])('rejects unconfigured origin %s', (origin) => {
    expect(() => tossAppCredentials(origin)).toThrow();
  });
});
