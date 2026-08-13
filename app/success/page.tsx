import type { Metadata } from "next"

import { SuccessTicket } from "@/components/success-ticket"

export const metadata: Metadata = {
  title: "Demo Request Confirmed | SMRT",
  description: "Your SMRT demo request has been received.",
}

export default function SuccessPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white px-4 py-10">
      <div className="relative z-10 flex w-full justify-center">
        <SuccessTicket />
      </div>
    </main>
  )
}
