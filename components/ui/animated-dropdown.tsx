"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export type DropdownOption = {
  value: string
  label: string
}

type AnimatedDropdownBaseProps = {
  options: DropdownOption[]
  placeholder?: string
  className?: string
  triggerClassName?: string
  menuClassName?: string
  fitContent?: boolean
  "aria-invalid"?: boolean
  id?: string
}

type AnimatedDropdownProps = AnimatedDropdownBaseProps &
  (
    | {
        multiple?: false
        value: string
        onChange: (value: string) => void
      }
    | {
        multiple: true
        value: string[]
        onChange: (value: string[]) => void
      }
  )

export function AnimatedDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className,
  triggerClassName,
  menuClassName,
  fitContent = false,
  multiple = false,
  "aria-invalid": ariaInvalid,
  id,
}: AnimatedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null
  )
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (wrapperRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      closeMenu()
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [isOpen, closeMenu])

  const updateMenuPosition = useCallback(() => {
    const trigger = wrapperRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    setMenuStyle({
      top: rect.bottom + 6,
      left: rect.left,
      width: fitContent ? Math.max(rect.width, 144) : rect.width,
    })
  }, [fitContent])

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuStyle(null)
      return
    }

    updateMenuPosition()

    window.addEventListener("resize", updateMenuPosition)
    window.addEventListener("scroll", updateMenuPosition, true)

    return () => {
      window.removeEventListener("resize", updateMenuPosition)
      window.removeEventListener("scroll", updateMenuPosition, true)
    }
  }, [isOpen, updateMenuPosition])

  const selectedValues = multiple ? value : value ? [value] : []
  const selectedOptions = options.filter((option) => selectedValues.includes(option.value))
  const displayLabel =
    selectedOptions.length > 0
      ? selectedOptions.map((option) => option.label).join(", ")
      : placeholder

  const isSelected = (optionValue: string) => selectedValues.includes(optionValue)

  const handleOptionClick = (optionValue: string) => {
    if (multiple) {
      const current = value as string[]
      const next = current.includes(optionValue)
        ? current.filter((item) => item !== optionValue)
        : [...current, optionValue]
      ;(onChange as (value: string[]) => void)(next)
      return
    }

    ;(onChange as (value: string) => void)(optionValue)
    setIsOpen(false)
  }

  const menu =
    mounted && isOpen && menuStyle
      ? createPortal(
          <AnimatePresence>
            <motion.div
              key="dropdown-menu"
              ref={menuRef}
              role="listbox"
              aria-multiselectable={multiple || undefined}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: menuStyle.top,
                left: menuStyle.left,
                width: menuStyle.width,
              }}
              className={cn(
                "z-[9999] overflow-hidden rounded-md border border-input bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
                menuClassName
              )}
            >
              {options.map((option, index) => (
                <button
                  key={`${option.value}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected(option.value)}
                  onClick={() => handleOptionClick(option.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors",
                    "hover:bg-[#f5f5f5]",
                    isSelected(option.value) && "bg-[#f0f0f0] font-medium"
                  )}
                >
                  {multiple && (
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border border-input",
                        isSelected(option.value) &&
                          "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      {isSelected(option.value) && <Check className="size-3" strokeWidth={3} />}
                    </span>
                  )}
                  {option.label}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body
        )
      : null

  return (
    <>
      <div
        ref={wrapperRef}
        data-state={isOpen ? "open" : "closed"}
        className={cn("relative", fitContent ? "w-auto shrink-0" : "w-full", className)}
      >
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={ariaInvalid}
          onClick={() => setIsOpen((open) => !open)}
          className={cn(
            "inline-flex h-10 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm text-foreground transition-colors outline-none",
            fitContent ? "w-auto min-w-[5.75rem] whitespace-nowrap" : "w-full",
            "hover:bg-[#f5f5f5]",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            isOpen && "relative z-20 border-ring bg-white ring-3 ring-ring/20",
            ariaInvalid && "border-destructive bg-destructive/5 ring-destructive/20",
            triggerClassName
          )}
        >
          <span
            className={cn(
              "truncate text-left",
              selectedOptions.length === 0 && "font-normal text-muted-foreground"
            )}
          >
            {displayLabel}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="shrink-0 text-foreground/70"
          >
            <ChevronDown className="size-4" />
          </motion.span>
        </button>
      </div>
      {menu}
    </>
  )
}
