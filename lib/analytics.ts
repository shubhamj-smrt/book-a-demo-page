type EventParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function getMeasurementId() {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""
}

function getGtag() {
  if (typeof window === "undefined") return null

  window.dataLayer = window.dataLayer || []

  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      // Match the official gtag stub so the command queue is processed correctly
      window.dataLayer?.push(arguments)
    }
  }

  return window.gtag
}

function shouldDebug() {
  if (typeof window === "undefined") return false
  try {
    return new URLSearchParams(window.location.search).get("debug") === "1"
  } catch {
    return false
  }
}

export function trackEvent(eventName: string, params?: EventParams) {
  const measurementId = getMeasurementId()
  if (!measurementId) return

  const gtag = getGtag()
  if (!gtag) return

  gtag("event", eventName, {
    send_to: measurementId,
    ...(shouldDebug() ? { debug_mode: true } : {}),
    ...params,
  })
}

/** Wait until the GA script has had a chance to load, then fire. */
export function trackEventWhenReady(
  eventName: string,
  params?: EventParams,
  options?: { maxAttempts?: number; intervalMs?: number }
) {
  if (typeof window === "undefined") return

  const maxAttempts = options?.maxAttempts ?? 25
  const intervalMs = options?.intervalMs ?? 200
  let attempts = 0

  const trySend = () => {
    attempts += 1
    const hasScript = Boolean(
      document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
    )
    const gtagReady = typeof window.gtag === "function"

    if ((hasScript && gtagReady) || attempts >= maxAttempts) {
      trackEvent(eventName, params)
      return
    }

    window.setTimeout(trySend, intervalMs)
  }

  trySend()
}
