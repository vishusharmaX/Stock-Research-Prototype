import crypto from "crypto";

const DEFAULT_SECRET = process.env.TRANSCRIPT_SHARE_SECRET || "equity-intelligence-default-secret-salt-2026";

export interface GenerateShareTokenResult {
  rawToken: string;
  tokenHash: string;
  expiresAt: string;
}

export function generateShareToken(runId: string, hoursValid: number = 72): GenerateShareTokenResult {
  // Generate 256-bit cryptographically secure random entropy
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const rawToken = `${runId}_${randomBytes}`;

  // Hash using HMAC-SHA256
  const tokenHash = crypto
    .createHmac("sha256", DEFAULT_SECRET)
    .update(rawToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000).toISOString();

  return { rawToken, tokenHash, expiresAt };
}

export function hashShareToken(rawToken: string): string {
  return crypto
    .createHmac("sha256", DEFAULT_SECRET)
    .update(rawToken)
    .digest("hex");
}
