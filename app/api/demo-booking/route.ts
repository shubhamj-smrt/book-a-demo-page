import { NextResponse } from "next/server"

type DemoBookingPayload = {
  firstName: string
  lastName: string
  email: string
  phonePrefix: string
  phoneCountry: string
  phoneNumber: string
  phone: string
  company: string
  businessLocation: string
  otherCountry: string | null
  interests: string[]
  message: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function validatePayload(body: unknown): DemoBookingPayload | null {
  if (!body || typeof body !== "object") return null

  const data = body as Record<string, unknown>

  if (
    !isNonEmptyString(data.firstName) ||
    !isNonEmptyString(data.lastName) ||
    !isNonEmptyString(data.email) ||
    !isNonEmptyString(data.phoneNumber) ||
    !isNonEmptyString(data.company) ||
    !isNonEmptyString(data.businessLocation)
  ) {
    return null
  }

  const email = data.email.trim()
  const emailParts = email.split("@")
  if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1]?.includes(".")) {
    return null
  }

  if (!Array.isArray(data.interests) || data.interests.length === 0) {
    return null
  }

  const interests = data.interests.filter((item): item is string => typeof item === "string")
  if (interests.length === 0) return null

  if (data.businessLocation === "Other" && !isNonEmptyString(data.otherCountry)) {
    return null
  }

  const phonePrefix = isNonEmptyString(data.phonePrefix) ? data.phonePrefix.trim() : ""
  const phoneCountry = isNonEmptyString(data.phoneCountry) ? data.phoneCountry.trim() : ""
  const phoneNumber = data.phoneNumber.trim()
  const phone =
    isNonEmptyString(data.phone) ? data.phone.trim() : `${phonePrefix} ${phoneCountry} ${phoneNumber}`.trim()

  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email,
    phonePrefix,
    phoneCountry,
    phoneNumber,
    phone,
    company: data.company.trim(),
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
    businessLocation: payload.businessLocation,
    otherCountry: payload.otherCountry ?? "",
    interests: payload.interests.join(", "),
    message: payload.message,
  }
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const payload = validatePayload(body)
  if (!payload) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const webhookUrl = process.env.SLACK_DEMO_BOOKING_WEBHOOK_URL
  if (!webhookUrl) {
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
