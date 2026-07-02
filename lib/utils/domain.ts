// Strip protocol, www, path and trailing slash from a user-entered URL/domain.
export function cleanDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .replace(/\/+$/, '')
    .trim();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidDomain(domain: string): boolean {
  // Basic shape check: at least one dot, valid label chars.
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain);
}
