type EventParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function getGtag() {
  if (typeof window === "undefined") return null

  window.dataLayer = window.dataLayer || []

  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }
  }

  return window.gtag
}

export function trackEvent(eventName: string, params?: EventParams) {
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return

  const gtag = getGtag()
  if (!gtag) return

  gtag("event", eventName, params)
}
