"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type RosterRow = {
  host: string
  region: string
  interest: string
  url: string
  notes: string
}

const INTEREST_OPTIONS = ["POS", "Marketing", "Both", "Unknown"]

const emptyRow = (): RosterRow => ({
  host: "",
  region: "",
  interest: "POS",
  url: "",
  notes: "",
})

export default function DemodeskRosterPage() {
  const [rows, setRows] = useState<RosterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/demodesk-roster")
        const data = await res.json()
        setRows(Array.isArray(data.rows) ? data.rows : [])
      } catch {
        setStatus("Failed to load roster")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const updateRow = (index: number, key: keyof RosterRow, value: string) => {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    )
  }

  const addRow = () => setRows((current) => [...current, emptyRow()])

  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, i) => i !== index))
  }

  const save = async () => {
    try {
      setSaving(true)
      setStatus(null)
      const res = await fetch("/api/demodesk-roster", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      })
      if (!res.ok) throw new Error("Save failed")
      setStatus(`Saved ${rows.length} rows to data/demodesk-roster.json`)
    } catch {
      setStatus("Save failed — is the local server running?")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <p className="text-sm text-muted-foreground">Loading roster…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Temporary
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Demodesk roster</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Fill host, region, interest, and booking URL. Save writes to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">data/demodesk-roster.json</code>{" "}
            so we can wire routing from it.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={addRow} className="h-10 rounded-md px-4">
            Add row
          </Button>
          <Button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="h-10 rounded-md px-4"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </header>

      {status && <p className="mb-4 text-sm text-muted-foreground">{status}</p>}

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-3 font-medium">Host</th>
              <th className="px-3 py-3 font-medium">Region</th>
              <th className="px-3 py-3 font-medium">Interest</th>
              <th className="px-3 py-3 font-medium">Demodesk URL</th>
              <th className="px-3 py-3 font-medium">Notes</th>
              <th className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-border align-top last:border-b-0">
                <td className="p-2">
                  <Input
                    value={row.host}
                    onChange={(e) => updateRow(index, "host", e.target.value)}
                    placeholder="Name"
                    className="h-9"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={row.region}
                    onChange={(e) => updateRow(index, "region", e.target.value)}
                    placeholder="e.g. North America"
                    className="h-9"
                  />
                </td>
                <td className="p-2">
                  <select
                    value={row.interest}
                    onChange={(e) => updateRow(index, "interest", e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {INTEREST_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <Input
                    value={row.url}
                    onChange={(e) => updateRow(index, "url", e.target.value)}
                    placeholder="https://demodesk.com/book/..."
                    className="h-9"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={row.notes}
                    onChange={(e) => updateRow(index, "notes", e.target.value)}
                    placeholder="Optional"
                    className="h-9"
                  />
                </td>
                <td className="p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeRow(index)}
                    className="h-9 px-2 text-destructive"
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
