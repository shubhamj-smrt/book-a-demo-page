"use client"

import { useImperativeHandle, forwardRef, useRef } from "react"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"

export type TurnstileFieldHandle = {
  reset: () => void
}

type TurnstileFieldProps = {
  onToken: (token: string | null) => void
}

export const TurnstileField = forwardRef<TurnstileFieldHandle, TurnstileFieldProps>(
  function TurnstileField({ onToken }, ref) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
    const widgetRef = useRef<TurnstileInstance | null>(null)

    useImperativeHandle(ref, () => ({
      reset: () => {
        widgetRef.current?.reset()
        onToken(null)
      },
    }))

    if (!siteKey) return null

    return (
      <div className="flex justify-center">
        <Turnstile
          ref={widgetRef}
          siteKey={siteKey}
          options={{
            theme: "light",
            size: "normal",
          }}
          onSuccess={(token) => onToken(token)}
          onExpire={() => onToken(null)}
          onError={() => onToken(null)}
          onTimeout={() => onToken(null)}
        />
      </div>
    )
  }
)
