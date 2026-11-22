// Mirrors the server's company-name-match.ts (indemnity signer vs organizationName); keep in step.
const LEGAL_SUFFIXES = new Set([
  "ltd",
  "limited",
  "plc",
  "nig",
  "nigeria",
  "inc",
  "co",
  "company",
  "enterprise",
  "enterprises",
  "ventures",
  "services",
]);

function normalizeCompanyName(name: string) {
  const words = name.toLowerCase().replace(
    /[^\p{L}\p{N}\s]/gu,
    "",
  ).split(/\s+/).filter(Boolean);
  while (words.length > 1 && LEGAL_SUFFIXES.has(words[words.length - 1]!))
    words.pop();
  return words.join(" ");
}

function levenshtein(a: string, b: string) {
  let previous = Array.from(
    { length: b.length + 1 },
    (_, i) => i,
  );
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j]! + 1,
        current[j - 1]! + 1,
        previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length]!;
}

/** Equal after normalising, or a Levenshtein ratio of at least 0.85. */
export function companyNameMatches(typed: string, companyName: string) {
  const a = normalizeCompanyName(typed);
  const b = normalizeCompanyName(companyName);
  if (!a || !b)
    return false;
  return a === b || 1 - levenshtein(
    a,
    b,
  ) / Math.max(
    a.length,
    b.length,
  ) >= 0.85;
}
