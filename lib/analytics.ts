type EventParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(eventName: string, params?: EventParams) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return

  window.gtag("event", eventName, params)
}
