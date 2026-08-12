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

export type DemodeskMeetingScheduledPayload = {
  meetingDate?: string
  eventTypeSlug?: string
  hostEmail?: string
  isReschedule?: boolean
  form?: {
    customer_email?: string
    customer_first_name?: string
    customer_last_name?: string
    customer_company_name?: string
    customer_phone?: string
  }
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
