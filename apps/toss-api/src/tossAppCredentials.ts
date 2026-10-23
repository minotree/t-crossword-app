/** Origin only selects credentials; Toss still verifies the one-time code via mTLS. */
export function tossAppCredentials(origin: string | null) {
  if (origin === 'https://english-words.private-apps.tossmini.com' || origin === 'https://english-words.apps.tossmini.com') {
    return { cert: 'TOSS_ENGLISH_WORDS_MTLS_CERT_PEM', key: 'TOSS_ENGLISH_WORDS_MTLS_KEY_PEM', identityPrefix: 'english-words:' };
  }
  if (origin === 'https://t-crossword.private-apps.tossmini.com') {
    return { cert: 'TOSS_MTLS_CERT_PEM', key: 'TOSS_MTLS_KEY_PEM', identityPrefix: '' };
  }
  throw new Error('Unconfigured Toss app origin');
}
