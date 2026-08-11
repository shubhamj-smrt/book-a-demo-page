import type { Metadata } from "next"

import { SuccessTicket } from "@/components/success-ticket"

export const metadata: Metadata = {
  title: "Demo Request Confirmed | SMRT",
  description: "Your SMRT demo request has been received.",
}

export default function SuccessPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#ffffff_0%,_#f4f4f2_55%,_#ebebe8_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative z-10 flex w-full justify-center">
        <SuccessTicket />
      </div>
    </main>
  )
}
