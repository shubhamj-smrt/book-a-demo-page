"use client"

import { useEffect } from "react"
import confetti from "canvas-confetti"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

import { trackEventWhenReady } from "@/lib/analytics"

type SuccessTicketProps = {
  title?: string
  message?: string
}

const SUCCESS_EVENT = "demo_button_clicked"
const SUCCESS_EVENT_KEY = "smrt_demo_button_clicked_tracked"

function fireSuccessConfetti() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (prefersReducedMotion) return

  const colors = ["#1a7f45", "#22c55e", "#111111", "#f59e0b", "#3b82f6", "#ffffff"]

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.55 },
    colors,
    disableForReducedMotion: true,
  })

  window.setTimeout(() => {
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      disableForReducedMotion: true,
    })
    confetti({
      particleCount: 45,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      disableForReducedMotion: true,
    })
  }, 180)

  // Short fireworks-style follow-up, similar to 21st.dev confetti demos
  const duration = 1800
  const animationEnd = Date.now() + duration
  const defaults = {
    startVelocity: 28,
    spread: 360,
    ticks: 55,
    zIndex: 40,
    colors,
    disableForReducedMotion: true,
  }

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now()
    if (timeLeft <= 0) {
      clearInterval(interval)
      return
    }

    const particleCount = Math.floor(36 * (timeLeft / duration))
    confetti({
      ...defaults,
      particleCount,
      origin: { x: Math.random() * 0.2 + 0.1, y: Math.random() * 0.2 },
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() * 0.2 },
    })
  }, 220)
}

function trackDemoBookedOnce() {
  try {
    if (sessionStorage.getItem(SUCCESS_EVENT_KEY) === "1") return
    sessionStorage.setItem(SUCCESS_EVENT_KEY, "1")
  } catch {
    // sessionStorage unavailable — still fire the event once this mount
  }

  const params = {
    form_name: "book_demo",
    page_path: "/success",
    page_title: "Demo Request Confirmed | SMRT",
  }

  trackEventWhenReady(SUCCESS_EVENT, params)
  trackEventWhenReady("generate_lead", {
    ...params,
    currency: "USD",
    value: 0,
  })
}

export function SuccessTicket({
  title = "You're all set",
  message = "Your demo has been booked. Sit back and relax, we'll take it from here.",
}: SuccessTicketProps) {
  useEffect(() => {
    trackDemoBookedOnce()

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const initialTimer = window.setTimeout(() => {
      fireSuccessConfetti()
    }, 250)

    // Replay celebration every 15 seconds while the tab stays open
    const repeatTimer = window.setInterval(() => {
      fireSuccessConfetti()
    }, 15_000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(repeatTimer)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[420px]"
    >
      <div className="relative overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
        {/* Ticket side notches */}
        <span
          aria-hidden
          className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-[#f4f4f2]"
        />
        <span
          aria-hidden
          className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-[#f4f4f2]"
        />

        <div className="px-8 pt-10 pb-8 text-center sm:px-10">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.35, ease: "easeOut" }}
            className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-[#e8f8ee] text-[#1a7f45] ring-8 ring-[#e8f8ee]/60"
          >
            <Check className="size-7" strokeWidth={2.5} />
          </motion.div>

          <p className="mb-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Request confirmed
          </p>

          <h1 className="text-balance font-heading text-[28px] leading-tight font-bold tracking-tight text-foreground sm:text-[32px]">
            {title}
          </h1>

          <p className="mx-auto mt-4 max-w-[32ch] text-pretty text-[15px] leading-relaxed text-muted-foreground">
            {message}
          </p>
        </div>

        <div className="relative mx-6 border-t border-dashed border-black/15" />

        <div className="px-8 py-6 text-center sm:px-10">
          <p className="text-balance text-sm text-muted-foreground">
            A member of the SMRT team will follow up soon.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
