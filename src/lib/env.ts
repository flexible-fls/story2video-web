export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value.trim();
}

export function getOptionalEnv(name: string, fallback = "") {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

export function getOptionalNumberEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw || !raw.trim()) return fallback;

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}