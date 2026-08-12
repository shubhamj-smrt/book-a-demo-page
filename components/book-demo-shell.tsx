"use client"

import { useState } from "react"

import { BookDemoForm } from "@/components/book-demo-form"
import { cn } from "@/lib/utils"

export function BookDemoShell() {
  const [scheduleStep, setScheduleStep] = useState(false)

  return (
    <main className="flex justify-center p-3 sm:p-5">
      <div
        className={cn(
          "w-full rounded-xl bg-card p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:p-10",
          scheduleStep ? "max-w-[640px]" : "max-w-[500px]"
        )}
      >
        <header className="mb-4 text-center">
          <h1 className="text-balance font-heading text-[24px] font-bold tracking-tight text-foreground sm:text-[28px]">
            Schedule a Meeting with&nbsp;SMRT
          </h1>
        </header>
        <BookDemoForm onScheduleStepChange={setScheduleStep} />
      </div>
    </main>
  )
}
