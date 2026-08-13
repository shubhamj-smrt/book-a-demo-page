"use client"

import { useEffect, useState } from "react"

import { BookDemoForm, type BookDemoStep } from "@/components/book-demo-form"
import { postEmbedHeight } from "@/components/embed-resizer"
import { cn } from "@/lib/utils"

export function BookDemoShell() {
  const [step, setStep] = useState<BookDemoStep>("business-details")
  const isSchedule = step === "schedule"

  useEffect(() => {
    postEmbedHeight()
    const timers = [50, 200, 400].map((ms) => window.setTimeout(postEmbedHeight, ms))
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [step])

  return (
    <div id="smrt-embed-root" className="w-full">
      <main
        className={cn(
          "flex justify-center",
          // Compact mobile padding so the Framer iframe can stay shorter
          "px-4 py-4 sm:p-5"
        )}
      >
        <div
          data-smrt-embed-card
          className={cn(
            "w-full rounded-xl bg-card p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:p-10",
            isSchedule ? "max-w-[640px]" : "max-w-[500px]"
          )}
        >
          <header className="mb-4 text-center">
            <h1 className="text-balance font-heading text-[24px] font-bold tracking-tight text-foreground sm:text-[28px]">
              {step === "review" ? "Meeting Summary" : "Schedule a Meeting with\u00a0SMRT"}
            </h1>
          </header>
          <BookDemoForm onStepChange={setStep} />
        </div>
      </main>
    </div>
  )
}
