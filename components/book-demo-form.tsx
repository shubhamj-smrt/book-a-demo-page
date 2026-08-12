"use client"

import { useEffect, useRef, useState } from "react"

import { AnimatedDropdown } from "@/components/ui/animated-dropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  isDemodeskMeetingScheduledEvent,
  resolveDemodeskBookingUrl,
  type DemodeskMeetingScheduledPayload,
} from "@/lib/demodesk"
import { businessLocationOptions, interestOptions } from "@/lib/form-config"

type FormValues = {
  businessLocation: string
  otherCountry: string
  interests: string[]
  message: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>
type Step = "business-details" | "schedule"

const initialValues: FormValues = {
  businessLocation: "",
  otherCountry: "",
  interests: [],
  message: "",
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.businessLocation) errors.businessLocation = "Please select a region"
  if (values.businessLocation === "Other" && !values.otherCountry.trim()) {
    errors.otherCountry = "Please enter your country"
  }
  if (values.interests.length === 0) errors.interests = "Please select at least one option"

  return errors
}

function isFormValid(values: FormValues) {
  return Object.keys(validate(values)).length === 0
}

function RequiredMark() {
  return <span className="text-destructive"> *</span>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

function buildPayload(
  values: FormValues,
  demodesk?: DemodeskMeetingScheduledPayload
) {
  const demodeskForm = demodesk?.form
  const phone = demodeskForm?.customer_phone?.trim() || ""

  return {
    firstName: demodeskForm?.customer_first_name?.trim() || "",
    lastName: demodeskForm?.customer_last_name?.trim() || "",
    email: demodeskForm?.customer_email?.trim() || "",
    phonePrefix: "",
    phoneCountry: "",
    phoneNumber: phone,
    phone,
    company: demodeskForm?.customer_company_name?.trim() || "",
    businessLocation: values.businessLocation,
    otherCountry: values.businessLocation === "Other" ? values.otherCountry.trim() : null,
    interests: values.interests,
    message: values.message.trim(),
  }
}

type BookDemoFormProps = {
  onScheduleStepChange?: (isScheduleStep: boolean) => void
}

export function BookDemoForm({ onScheduleStepChange }: BookDemoFormProps) {
  const [step, setStep] = useState<Step>("business-details")
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingUrl, setBookingUrl] = useState<string | null>(null)
  const [canFinish, setCanFinish] = useState(false)
  const demodeskPayloadRef = useRef<DemodeskMeetingScheduledPayload | undefined>(undefined)
  const hasSubmittedBooking = useRef(false)
  const valuesRef = useRef(values)

  const resetForm = () => {
    setValues(initialValues)
    setErrors({})
    setHasAttemptedSubmit(false)
    setBookingUrl(null)
    setCanFinish(false)
    demodeskPayloadRef.current = undefined
    hasSubmittedBooking.current = false
    setStep("business-details")
  }

  useEffect(() => {
    valuesRef.current = values
  }, [values])

  useEffect(() => {
    onScheduleStepChange?.(step === "schedule")
  }, [step, onScheduleStepChange])

  const updateField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    let next: FormValues = { ...values, [key]: value }

    if (key === "businessLocation" && value !== "Other") {
      next.otherCountry = ""
    }

    setValues(next)

    if (hasAttemptedSubmit) {
      setErrors(validate(next))
    }
  }

  const goToSchedule = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasAttemptedSubmit(true)

    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const url = resolveDemodeskBookingUrl(values.interests, values.businessLocation)
    setBookingUrl(url)
    hasSubmittedBooking.current = false
    demodeskPayloadRef.current = undefined
    setCanFinish(false)
    setStep("schedule")
  }

  const goBackToDetails = () => {
    setCanFinish(false)
    demodeskPayloadRef.current = undefined
    setStep("business-details")
  }

  const finalizeBooking = async (demodesk?: DemodeskMeetingScheduledPayload) => {
    if (hasSubmittedBooking.current || isSubmitting) return
    hasSubmittedBooking.current = true

    // Open synchronously on the Finish click so popup blockers allow the GA success tab.
    const successWindow = window.open("about:blank", "_blank")

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/demo-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(valuesRef.current, demodesk)),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        console.error("Demo booking submit failed:", response.status, data)
        hasSubmittedBooking.current = false
        successWindow?.close()
        alert(data?.error || "An error occurred. Please try again.")
        return
      }

      const successUrl = `${window.location.origin}/success`
      if (successWindow) {
        successWindow.location.href = successUrl
      } else {
        window.open(successUrl, "_blank", "noopener,noreferrer")
      }
      resetForm()
    } catch (error) {
      console.error("Error:", error)
      hasSubmittedBooking.current = false
      successWindow?.close()
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (step !== "schedule") return

    const onMessage = (event: MessageEvent) => {
      const origin = event.origin || ""
      if (origin && !origin.includes("demodesk.com")) return
      if (!isDemodeskMeetingScheduledEvent(event.data)) return
      demodeskPayloadRef.current = event.data.data
      setCanFinish(true)
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [step])

  if (step === "schedule" && bookingUrl) {
    return (
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <iframe
            title="Schedule your demo"
            src={bookingUrl}
            className="h-[720px] w-full border-0"
            allow="camera; microphone; fullscreen"
          />
        </div>

        {canFinish && !isSubmitting && (
          <p className="text-center text-sm text-[#1a7f45]">
            Meeting booked — tap Finish to continue.
          </p>
        )}

        {isSubmitting && (
          <p className="text-center text-sm text-muted-foreground">Confirming your booking…</p>
        )}

        <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={goBackToDetails}
            className="h-12 w-full rounded-md text-base"
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={() => void finalizeBooking(demodeskPayloadRef.current)}
            className="h-12 w-full rounded-md text-base"
            disabled={!canFinish || isSubmitting}
          >
            {isSubmitting ? "Finishing…" : "Finish"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={goToSchedule} noValidate className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        <span className="text-destructive">*</span> Required fields
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="businessLocation">
          Where is your business located?
          <RequiredMark />
        </Label>
        <AnimatedDropdown
          id="businessLocation"
          options={businessLocationOptions}
          value={values.businessLocation}
          onChange={(value) => updateField("businessLocation", value)}
          placeholder="Select a region"
          aria-invalid={Boolean(errors.businessLocation)}
        />
        <FieldError message={errors.businessLocation} />
      </div>

      {values.businessLocation === "Other" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="otherCountry">
            Country
            <RequiredMark />
          </Label>
          <Input
            id="otherCountry"
            placeholder="Enter your country"
            value={values.otherCountry}
            aria-invalid={Boolean(errors.otherCountry)}
            onChange={(event) => updateField("otherCountry", event.target.value)}
          />
          <FieldError message={errors.otherCountry} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="interests">
          What are you interested in?
          <RequiredMark />
        </Label>
        <AnimatedDropdown
          id="interests"
          multiple
          options={interestOptions}
          value={values.interests}
          onChange={(value) => updateField("interests", value)}
          placeholder="Select all that apply"
          aria-invalid={Boolean(errors.interests)}
        />
        <FieldError message={errors.interests} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Additional Details</Label>
        <textarea
          id="message"
          placeholder="Tell us about your needs..."
          value={values.message}
          onChange={(event) => updateField("message", event.target.value)}
          className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <Button
        type="submit"
        disabled={!isFormValid(values)}
        className="mt-1 h-12 w-full rounded-md text-base"
      >
        Pick Date and Time
      </Button>
    </form>
  )
}
