type TurnstileVerifyResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; errorCodes?: string[]; misconfigured?: boolean }

type SiteverifyResponse = {
  success?: boolean
  "error-codes"?: string[]
}

/**
 * Verify a Turnstile token with Cloudflare siteverify.
 * - Production: missing secret → misconfigured (caller should 503)
 * - Development: missing secret → skip (parity with Slack webhook skip)
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim()

  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("TURNSTILE_SECRET_KEY is not configured — skipping Turnstile in development")
      return { ok: true, skipped: true }
    }
    return { ok: false, misconfigured: true, errorCodes: ["missing-secret"] }
  }

  const trimmed = token.trim()
  if (!trimmed) {
    return { ok: false, errorCodes: ["missing-input-response"] }
  }

  const body = new URLSearchParams()
  body.set("secret", secret)
  body.set("response", trimmed)
  if (remoteip) body.set("remoteip", remoteip)

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })

    const data = (await response.json()) as SiteverifyResponse
    if (data.success) return { ok: true }

    return { ok: false, errorCodes: data["error-codes"] }
  } catch (error) {
    console.error("Turnstile siteverify request failed:", error)
    return { ok: false, errorCodes: ["siteverify-request-failed"] }
  }
}
