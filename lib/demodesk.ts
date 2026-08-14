import { DEMODESK_LINK_INDEX } from "@/lib/demodesk-roster"

/** @deprecated Prefer DEMODESK_LINK_INDEX — kept for any existing imports. */
export const DEMODESK_LINKS = DEMODESK_LINK_INDEX

export const INTEREST_POS = "SMRT Point of Sale"
export const INTEREST_MARKETING = "SMRT Marketing"

type BusinessLocation =
  | "North America"
  | "Australia"
  | "Europe/Middle East"
  | "India"
  | "Other"
  | string

/** North America: rotate Josh/David (demo) vs Brett (meeting-60-min-copy-2). */
function pickNorthAmericaLink() {
  return Math.random() < 0.5
    ? DEMODESK_LINK_INDEX.posUsA
    : DEMODESK_LINK_INDEX.posUsB
}

/**
 * Route by form location to the confirmed roster:
 * - Europe/Middle East → Milad
 * - Australia → Mark
 * - India → Nupur
 * - North America / Other → Josh & David or Brett (random)
 *
 * Interest (POS / Marketing / both) uses the same regional hosts.
 */
export function resolveDemodeskBookingUrl(
  _interests: string[],
  businessLocation: BusinessLocation
) {
  switch (businessLocation) {
    case "Europe/Middle East":
      return DEMODESK_LINK_INDEX.posEurope
    case "Australia":
      return DEMODESK_LINK_INDEX.posAustralia
    case "India":
      return DEMODESK_LINK_INDEX.posIndia
    case "North America":
    case "Other":
    default:
      return pickNorthAmericaLink()
  }
}

export type DemodeskFormFields = {
  customer_email?: string
  customer_first_name?: string
  customer_last_name?: string
  customer_company_name?: string
  customer_phone?: string
  guests?: unknown
  [key: string]: unknown
}

export type DemodeskMeetingScheduledPayload = {
  meetingDate?: string
  eventTypeSlug?: string
  hostEmail?: string
  isReschedule?: boolean
  form?: DemodeskFormFields
}

const COMPANY_FIELD_CANDIDATES = [
  "customer_company_name",
  "company_name_copy",
  "company",
  "company_name",
  "business_name",
  "businessName",
  "organization",
  "organisation",
  "participant_company_name",
] as const

function readFormString(form: DemodeskFormFields | undefined, key: string): string {
  if (!form) return ""
  const value = form[key]
  return typeof value === "string" ? value.trim() : ""
}

/** Prefer system token, then common aliases / any *company* key (except host). */
export function getDemodeskCompany(form?: DemodeskFormFields): string {
  for (const key of COMPANY_FIELD_CANDIDATES) {
    const value = readFormString(form, key)
    if (value) return value
  }

  if (!form) return ""

  for (const [key, value] of Object.entries(form)) {
    const normalized = key.toLowerCase()
    if (!normalized.includes("company") || normalized.includes("host")) continue
    if (typeof value === "string" && value.trim()) return value.trim()
  }

  return ""
}

export function getDemodeskFirstName(form?: DemodeskFormFields): string {
  return readFormString(form, "customer_first_name")
}

export function getDemodeskLastName(form?: DemodeskFormFields): string {
  return readFormString(form, "customer_last_name")
}

export function getDemodeskEmail(form?: DemodeskFormFields): string {
  return readFormString(form, "customer_email")
}

export function getDemodeskPhone(form?: DemodeskFormFields): string {
  return (
    readFormString(form, "customer_phone") ||
    readFormString(form, "phone") ||
    readFormString(form, "phone_number")
  )
}

export function isDemodeskMeetingScheduledEvent(
  data: unknown
): data is { event: "demodesk.meetingScheduled"; data?: DemodeskMeetingScheduledPayload } {
  return (
    typeof data === "object" &&
    data !== null &&
    "event" in data &&
    (data as { event?: unknown }).event === "demodesk.meetingScheduled"
  )
}
