"use client"

import { useMemo, useRef, useState } from "react"

import { AnimatedDropdown } from "@/components/ui/animated-dropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  businessLocationOptions,
  dialCodeToValue,
  getBusinessLocationForPhonePrefix,
  getPhonePlaceholder,
  getPhonePrefixOptions,
  interestOptions,
  parseDialCodeValue,
} from "@/lib/form-config"
import { cn } from "@/lib/utils"

type FormValues = {
  firstName: string
  lastName: string
  email: string
  phonePrefix: string
  phone: string
  company: string
  businessLocation: string
  otherCountry: string
  interests: string[]
  message: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phonePrefix: "+1|US",
  phone: "",
  company: "",
  businessLocation: "",
  otherCountry: "",
  interests: [],
  message: "",
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.firstName.trim()) errors.firstName = "This field is required"
  if (!values.lastName.trim()) errors.lastName = "This field is required"

  const email = values.email.trim()
  if (!email) {
    errors.email = "This field is required"
  } else {
    const parts = email.split("@")
    if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes(".")) {
      errors.email = "Enter a valid email address"
    }
  }

  const phone = values.phone.trim()
  if (!phone) {
    errors.phone = "This field is required"
  } else if (phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Enter a valid phone number"
  }

  if (!values.company.trim()) errors.company = "This field is required"
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

export function BookDemoForm() {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const hasSyncedLocationFromPhone = useRef(false)

  const phonePrefixOptions = useMemo(
    () =>
      getPhonePrefixOptions().map((code) => ({
        value: dialCodeToValue(code),
        label: code.label,
      })),
    []
  )

  const phonePlaceholder = useMemo(
    () => getPhonePlaceholder(values.phonePrefix),
    [values.phonePrefix]
  )

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

  const handlePhonePrefixChange = (value: string) => {
    if (value === values.phonePrefix) return

    let next: FormValues = { ...values, phonePrefix: value }

    if (!hasSyncedLocationFromPhone.current) {
      hasSyncedLocationFromPhone.current = true
      const location = getBusinessLocationForPhonePrefix(value)
      if (location) {
        next.businessLocation = location
        if (location !== "Other") {
          next.otherCountry = ""
        }
      }
    }

    setValues(next)

    if (hasAttemptedSubmit) {
      setErrors(validate(next))
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasAttemptedSubmit(true)

    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const { dialCode, abbr } = parseDialCodeValue(values.phonePrefix)
    const phoneNumber = values.phone.trim()

    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phonePrefix: dialCode,
      phoneCountry: abbr,
      phoneNumber,
      phone: `${dialCode} ${abbr} ${phoneNumber}`.trim(),
      company: values.company.trim(),
      businessLocation: values.businessLocation,
      otherCountry: values.businessLocation === "Other" ? values.otherCountry.trim() : null,
      interests: values.interests,
      message: values.message.trim(),
    }

    try {
      const response = await fetch("/api/demo-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Submission failed")
      }

      setIsSubmitted(true)
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred. Please try again.")
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-center text-sm text-green-800">
        ✓ Thank you! We&apos;ll be in touch shortly to schedule your demo.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        <span className="text-destructive">*</span> Required fields
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">
            First Name
            <RequiredMark />
          </Label>
          <Input
            id="firstName"
            placeholder="Jane"
            value={values.firstName}
            aria-invalid={Boolean(errors.firstName)}
            onChange={(event) => updateField("firstName", event.target.value)}
          />
          <FieldError message={errors.firstName} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">
            Last Name
            <RequiredMark />
          </Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={values.lastName}
            aria-invalid={Boolean(errors.lastName)}
            onChange={(event) => updateField("lastName", event.target.value)}
          />
          <FieldError message={errors.lastName} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">
          Email Address
          <RequiredMark />
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="jane@company.com"
          value={values.email}
          aria-invalid={Boolean(errors.email)}
          onChange={(event) => updateField("email", event.target.value)}
        />
        <FieldError message={errors.email} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">
          Best number to reach you
          <RequiredMark />
        </Label>
        <div
          className={cn(
            "relative flex rounded-md border border-input bg-transparent",
            errors.phone && "border-destructive ring-3 ring-destructive/20"
          )}
        >
          <AnimatedDropdown
            options={phonePrefixOptions}
            value={values.phonePrefix}
            onChange={handlePhonePrefixChange}
            fitContent
            menuClassName="min-w-[9rem]"
            triggerClassName="h-10 rounded-none rounded-l-md border-0 border-r border-input pr-2 shadow-none hover:bg-[#f5f5f5]"
            aria-invalid={Boolean(errors.phone)}
          />
          <Input
            id="phone"
            type="tel"
            placeholder={phonePlaceholder}
            value={values.phone}
            aria-invalid={Boolean(errors.phone)}
            onChange={(event) => updateField("phone", event.target.value)}
            className="h-10 rounded-none rounded-r-md border-0 shadow-none focus-visible:z-10"
          />
        </div>
        <FieldError message={errors.phone} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="company">
          Business Name
          <RequiredMark />
        </Label>
        <Input
          id="company"
          value={values.company}
          placeholder="The Best Dry Cleaner"
          aria-invalid={Boolean(errors.company)}
          onChange={(event) => updateField("company", event.target.value)}
        />
        <FieldError message={errors.company} />
      </div>

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
        Schedule Demo
      </Button>
    </form>
  )
}
