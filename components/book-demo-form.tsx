"use client"

import { useEffect, useRef, useState } from "react"

import { AnimatedDropdown } from "@/components/ui/animated-dropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  TurnstileField,
  type TurnstileFieldHandle,
} from "@/components/turnstile-field"
import {
  getDemodeskCompany,
  getDemodeskEmail,
  getDemodeskFirstName,
  getDemodeskLastName,
  getDemodeskPhone,
  getDemodeskSource,
  isDemodeskMeetingScheduledEvent,
  resolveDemodeskBookingUrl,
  type DemodeskMeetingScheduledPayload,
} from "@/lib/demodesk"
import { postEmbedHeight } from "@/components/embed-resizer"
import { businessLocationOptions, interestOptions } from "@/lib/form-config"

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ""

type FormValues = {
  businessLocation: string
  otherCountry: string
  interests: string[]
  message: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>
export type BookDemoStep = "business-details" | "schedule" | "review"

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

function displayValue(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : "—"
}

function formatMeetingDate(iso?: string) {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date)
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground break-words">{value}</dd>
    </div>
  )
}

function buildPayload(
  values: FormValues,
  demodesk?: DemodeskMeetingScheduledPayload
) {
  const demodeskForm = demodesk?.form
  const phone = getDemodeskPhone(demodeskForm)

  return {
    firstName: getDemodeskFirstName(demodeskForm),
    lastName: getDemodeskLastName(demodeskForm),
    email: getDemodeskEmail(demodeskForm),
    phonePrefix: "",
    phoneCountry: "",
    phoneNumber: phone,
    phone,
    company: getDemodeskCompany(demodeskForm),
    source: getDemodeskSource(demodeskForm),
    businessLocation: values.businessLocation,
    otherCountry: values.businessLocation === "Other" ? values.otherCountry.trim() : null,
    interests: values.interests,
    message: values.message.trim(),
  }
}

type BookDemoFormProps = {
  onStepChange?: (step: BookDemoStep) => void
}

export function BookDemoForm({ onStepChange }: BookDemoFormProps) {
  const [step, setStep] = useState<BookDemoStep>("business-details")
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingUrl, setBookingUrl] = useState<string | null>(null)
  const [demodeskPayload, setDemodeskPayload] = useState<
    DemodeskMeetingScheduledPayload | undefined
  >(undefined)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileFieldHandle>(null)
  const hasSubmittedBooking = useRef(false)
  const valuesRef = useRef(values)
  const turnstileRequired = Boolean(TURNSTILE_SITE_KEY)

  const resetForm = () => {
    setValues(initialValues)
    setErrors({})
    setHasAttemptedSubmit(false)
    setBookingUrl(null)
    setDemodeskPayload(undefined)
    setTurnstileToken(null)
    hasSubmittedBooking.current = false
    setStep("business-details")
  }

  useEffect(() => {
    valuesRef.current = values
  }, [values])

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  useEffect(() => {
    postEmbedHeight()
    const timers = [50, 200, 400].map((ms) => window.setTimeout(postEmbedHeight, ms))
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [step])

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
    setDemodeskPayload(undefined)
    setStep("schedule")
  }

  const goBackToDetails = () => {
    setDemodeskPayload(undefined)
    setStep("business-details")
  }

  const finalizeBooking = async () => {
    if (hasSubmittedBooking.current || isSubmitting || !demodeskPayload) return
    if (turnstileRequired && !turnstileToken) return
    hasSubmittedBooking.current = true

    // Open synchronously on Finish so popup blockers allow the GA success tab.
    const successWindow = window.open("about:blank", "_blank")

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/demo-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildPayload(valuesRef.current, demodeskPayload),
          turnstileToken: turnstileToken ?? "",
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        console.error("Demo booking submit failed:", response.status, data)
        hasSubmittedBooking.current = false
        successWindow?.close()
        if (response.status === 403) {
          turnstileRef.current?.reset()
          setTurnstileToken(null)
        }
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

      setDemodeskPayload(event.data.data ?? {})
      if (process.env.NODE_ENV === "development") {
        console.info(
          "[demodesk.meetingScheduled] form keys:",
          Object.keys(event.data.data?.form ?? {})
        )
        console.info("[demodesk.meetingScheduled] form:", event.data.data?.form)
      }
      setStep("review")
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [step])

  if (step === "review" && demodeskPayload) {
    const form = demodeskPayload.form
    const fullName = [getDemodeskFirstName(form), getDemodeskLastName(form)]
      .filter(Boolean)
      .join(" ")
    const locationLabel =
      values.businessLocation === "Other"
        ? `${values.businessLocation} (${values.otherCountry.trim() || "—"})`
        : values.businessLocation

    return (
      <div className="flex flex-col gap-5">
        <p className="text-center text-sm text-muted-foreground">
          Review your details and finish booking below.
        </p>

        <dl className="rounded-md border border-border px-4">
          <ReviewRow label="Meeting" value={formatMeetingDate(demodeskPayload.meetingDate)} />
          <ReviewRow label="Name" value={displayValue(fullName)} />
          <ReviewRow label="Email" value={displayValue(getDemodeskEmail(form))} />
          <ReviewRow label="Phone" value={displayValue(getDemodeskPhone(form))} />
          <ReviewRow label="Company" value={displayValue(getDemodeskCompany(form))} />
          <ReviewRow label="Source" value={displayValue(getDemodeskSource(form))} />
          <ReviewRow label="Location" value={displayValue(locationLabel)} />
          <ReviewRow label="Interest" value={displayValue(values.interests.join(", "))} />
          <ReviewRow label="Message" value={displayValue(values.message)} />
        </dl>

        <TurnstileField ref={turnstileRef} onToken={setTurnstileToken} />

        {isSubmitting && (
          <p className="text-center text-sm text-muted-foreground">Confirming your booking…</p>
        )}

        <Button
          type="button"
          onClick={() => void finalizeBooking()}
          className="h-12 w-full rounded-md text-base"
          disabled={isSubmitting || (turnstileRequired && !turnstileToken)}
        >
          {isSubmitting ? "Finishing…" : "Finish Booking"}
        </Button>
      </div>
    )
  }

  if (step === "schedule" && bookingUrl) {
    return (
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <iframe
            title="Schedule your demo"
            src={bookingUrl}
            className="h-[min(960px,85vh)] min-h-[880px] w-full border-0"
            allow="camera; microphone; fullscreen"
            onLoad={() => {
              postEmbedHeight()
              window.setTimeout(postEmbedHeight, 200)
              window.setTimeout(postEmbedHeight, 600)
            }}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={goBackToDetails}
          className="h-12 w-full rounded-md text-base"
        >
          Back
        </Button>
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
