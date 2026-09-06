import "server-only";

/**
 * Cloudflare Turnstile verification.
 *
 * Must run server-side: a client-only check is skipped entirely by anyone
 * POSTing the API directly, which is exactly what a bot does.
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Unconfigured is treated as pass so the app is usable before keys are set.
  // Production must set the key — without it there is no bot protection at all.
  if (!secret) return true;
  if (!token) return false;

  try {
    const body = new FormData();
    body.append("secret", secret);
    body.append("response", token);
    if (ip) body.append("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
