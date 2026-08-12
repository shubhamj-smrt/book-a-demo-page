/**
 * Demodesk demo roster — keep this updated as links/hosts change.
 *
 * Confirmed from booking pages / prior mapping (Aug 2026):
 */

export type DemodeskHostRecord = {
  host: string
  role?: string
  region: string
  interest: "POS" | "Marketing" | "Both" | "Unknown"
  url: string
  notes?: string
}

/**
 * Active intended demo handlers (product direction):
 * Milad, Mark, Brett, Josh, David — plus Nupur for India.
 */
export const INTENDED_DEMO_HANDLERS = [
  "Milad",
  "Mark",
  "Brett",
  "Josh",
  "David",
  "Nupur", // India
] as const

/**
 * Form location values (must match `businessLocationOptions` in form-config):
 * - North America
 * - Australia
 * - Europe/Middle East
 * - India
 * - Other
 *
 * Confirmed host → form location → link:
 * - Milad → Europe/Middle East → meeting-europe
 * - Mark → Australia → meeting-60-min-copy
 * - Josh + David → North America → demo (shared)
 * - Brett → North America → meeting-60-min-copy-2 (separate; rotate with demo)
 * - Nupur → India → meeting-india-nupur
 */

/** Links used by the booking router (from confirmed roster). */
export const DEMODESK_LINK_INDEX = {
  /** Josh & David (North America) */
  posUsA: "https://demodesk.com/book/smrt-systems-team/demo",
  /** Brett (North America) */
  posUsB: "https://demodesk.com/book/smrt-systems-team/meeting-60-min-copy-2",
  /** Milad (Europe/Middle East) */
  posEurope: "https://demodesk.com/book/smrt-systems-team/meeting-europe",
  /** Mark (Australia) */
  posAustralia: "https://demodesk.com/book/smrt-systems-team/meeting-60-min-copy",
  /** Nupur (India) */
  posIndia: "https://demodesk.com/book/smrt-systems-team/meeting-india-nupur",
} as const
