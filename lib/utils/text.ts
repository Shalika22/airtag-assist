export function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function safeSlice(s: string, max = 4000): string {
  const t = s ?? "";
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function tokenizeForLexical(s: string): string[] {
  return normalizeWhitespace(s.toLowerCase())
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function zEnvStr(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function zEnvUrl(name: string): string {
  const v = zEnvStr(name);
  try {
    URL.canParse(v);
    return v;
  } catch {
    throw new Error(`Invalid URL in env var ${name}: ${v}`);
  }
}

export function zEnvInt(name: string, defaultValue?: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    if (defaultValue === undefined) throw new Error(`Missing required env var: ${name}`);
    return defaultValue;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) throw new Error(`Invalid int for env var ${name}: ${raw}`);
  return n;
}

export function zEnvNum(name: string, defaultValue?: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    if (defaultValue === undefined) throw new Error(`Missing required env var: ${name}`);
    return defaultValue;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid number for env var ${name}: ${raw}`);
  return n;
}


