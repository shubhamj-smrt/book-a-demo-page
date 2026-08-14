import { NextResponse } from "next/server"

import { verifyTurnstileToken } from "@/lib/turnstile"

type DemoBookingPayload = {
  firstName: string
  lastName: string
  email: string
  phonePrefix: string
  phoneCountry: string
  phoneNumber: string
  phone: string
  company: string
  source: string
  businessLocation: string
  otherCountry: string | null
  interests: string[]
  message: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function validatePayload(body: unknown): DemoBookingPayload | null {
  if (!body || typeof body !== "object") return null

  const data = body as Record<string, unknown>

  // Contact fields (name, email, phone, company) come from Demodesk after booking.
  if (!isNonEmptyString(data.businessLocation)) {
    return null
  }

  const email = optionalString(data.email)
  if (email) {
    const emailParts = email.split("@")
    if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1]?.includes(".")) {
      return null
    }
  }

  if (!Array.isArray(data.interests) || data.interests.length === 0) {
    return null
  }

  const interests = data.interests.filter((item): item is string => typeof item === "string")
  if (interests.length === 0) return null

  if (data.businessLocation === "Other" && !isNonEmptyString(data.otherCountry)) {
    return null
  }

  const phonePrefix = optionalString(data.phonePrefix)
  const phoneCountry = optionalString(data.phoneCountry)
  const phoneNumber = optionalString(data.phoneNumber)
  const phone = isNonEmptyString(data.phone)
    ? data.phone.trim()
    : `${phonePrefix} ${phoneCountry} ${phoneNumber}`.trim()

  return {
    firstName: optionalString(data.firstName),
    lastName: optionalString(data.lastName),
    email,
    phonePrefix,
    phoneCountry,
    phoneNumber,
    phone,
    company: optionalString(data.company),
    source: optionalString(data.source),
    businessLocation: data.businessLocation.trim(),
    otherCountry:
      data.businessLocation === "Other" && isNonEmptyString(data.otherCountry)
        ? data.otherCountry.trim()
        : null,
    interests,
    message: typeof data.message === "string" ? data.message.trim() : "",
  }
}

function toSlackWorkflowPayload(payload: DemoBookingPayload) {
  return {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    phonePrefix: payload.phonePrefix,
    phoneCountry: payload.phoneCountry,
    phoneNumber: payload.phoneNumber,
    company: payload.company,
    source: payload.source,
    businessLocation: payload.businessLocation,
    otherCountry: payload.otherCountry ?? "",
    interests: payload.interests.join(", "),
    message: payload.message,
  }
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return request.headers.get("x-real-ip")?.trim() || undefined
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const turnstileToken =
    body && typeof body === "object" && "turnstileToken" in body
      ? optionalString((body as Record<string, unknown>).turnstileToken)
      : ""

  const turnstile = await verifyTurnstileToken(turnstileToken, getClientIp(request))
  if (!turnstile.ok) {
    if (turnstile.misconfigured) {
      console.error("TURNSTILE_SECRET_KEY is not configured")
      return NextResponse.json(
        { error: "Demo booking is temporarily unavailable" },
        { status: 503 }
      )
    }
    console.error("Turnstile verification failed:", turnstile.errorCodes)
    return NextResponse.json({ error: "Security check failed" }, { status: 403 })
  }

  const payload = validatePayload(body)
  if (!payload) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const webhookUrl = process.env.SLACK_DEMO_BOOKING_WEBHOOK_URL
  if (!webhookUrl) {
    // Local/dev without Slack should still reach the success screen.
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "SLACK_DEMO_BOOKING_WEBHOOK_URL is not configured — skipping Slack in development"
      )
      return NextResponse.json({ ok: true, slackSkipped: true })
    }

    console.error("SLACK_DEMO_BOOKING_WEBHOOK_URL is not configured")
    return NextResponse.json({ error: "Demo booking is temporarily unavailable" }, { status: 503 })
  }

  try {
    const slackResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSlackWorkflowPayload(payload)),
    })

    if (!slackResponse.ok) {
      console.error("Slack webhook failed:", slackResponse.status, await slackResponse.text())
      return NextResponse.json({ error: "Failed to submit demo request" }, { status: 502 })
    }
  } catch (error) {
    console.error("Slack webhook request failed:", error)
    return NextResponse.json({ error: "Failed to submit demo request" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
