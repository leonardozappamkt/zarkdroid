/** Only same-site paths are allowed as a post-login destination (blocks open redirects like //evil.com). */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  return raw;
}
