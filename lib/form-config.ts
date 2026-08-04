export type DialCode = {
  dialCode: string
  abbr: string
  label: string
}

/** Full phone prefix list — always shown regardless of business location */
export const phonePrefixOptionsList: DialCode[] = [
  { dialCode: "+1", abbr: "US", label: "+1 US" },
  { dialCode: "+1", abbr: "CA", label: "+1 CA" },
  { dialCode: "+44", abbr: "UK", label: "+44 UK" },
  { dialCode: "+971", abbr: "UAE", label: "+971 UAE" },
  { dialCode: "+61", abbr: "AU", label: "+61 AU" },
  { dialCode: "+91", abbr: "IN", label: "+91 IN" },
  { dialCode: "+46", abbr: "SE", label: "+46 SE" },
]

/** Maps phone prefixes to business location (for one-time sync) */
export const regionDialCodes: Record<string, DialCode[]> = {
  "North America": [
    { dialCode: "+1", abbr: "US", label: "+1 US" },
    { dialCode: "+1", abbr: "CA", label: "+1 CA" },
  ],
  Australia: [{ dialCode: "+61", abbr: "AU", label: "+61 AU" }],
  "Europe/Middle East": [
    { dialCode: "+44", abbr: "UK", label: "+44 UK" },
    { dialCode: "+971", abbr: "UAE", label: "+971 UAE" },
    { dialCode: "+46", abbr: "SE", label: "+46 SE" },
  ],
  India: [{ dialCode: "+91", abbr: "IN", label: "+91 IN" }],
  Other: [],
}

export const businessLocationOptions = [
  { value: "North America", label: "North America" },
  { value: "Australia", label: "Australia" },
  { value: "Europe/Middle East", label: "Europe/Middle East" },
  { value: "India", label: "India" },
  { value: "Other", label: "Other" },
]

export const interestOptions = [
  { value: "SMRT Point of Sale", label: "SMRT Point of Sale" },
  { value: "SMRT Marketing", label: "SMRT Marketing" },
]

export function dialCodeToValue(dialCode: DialCode) {
  return `${dialCode.dialCode}|${dialCode.abbr}`
}

export function parseDialCodeValue(value: string) {
  const [dialCode, abbr] = value.split("|")
  return { dialCode, abbr }
}

export function getPhonePrefixOptions() {
  return phonePrefixOptionsList
}

const phonePlaceholdersByAbbr: Record<string, string> = {
  US: "555 123 4567",
  CA: "416 555 0123",
  UK: "7911 123456",
  AU: "412 345 678",
  IN: "98765 43210",
  UAE: "50 123 4567",
  SE: "70 123 45 67",
}

export function getPhonePlaceholder(phonePrefixValue: string) {
  const { abbr } = parseDialCodeValue(phonePrefixValue)
  return phonePlaceholdersByAbbr[abbr] ?? "555 123 4567"
}

const businessLocationPriority = [
  "North America",
  "Australia",
  "India",
  "Europe/Middle East",
  "Other",
] as const

export function getBusinessLocationForPhonePrefix(phonePrefixValue: string) {
  const { dialCode, abbr } = parseDialCodeValue(phonePrefixValue)

  for (const region of businessLocationPriority) {
    const codes = regionDialCodes[region]
    if (codes.some((code) => code.dialCode === dialCode && code.abbr === abbr)) {
      return region
    }
  }

  return null
}
