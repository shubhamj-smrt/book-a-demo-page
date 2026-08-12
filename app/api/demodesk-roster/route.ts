import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"

export type RosterRow = {
  host: string
  region: string
  interest: string
  url: string
  notes: string
}

const rosterPath = path.join(process.cwd(), "data", "demodesk-roster.json")

async function readRoster(): Promise<RosterRow[]> {
  const raw = await fs.readFile(rosterPath, "utf8")
  return JSON.parse(raw) as RosterRow[]
}

export async function GET() {
  try {
    const rows = await readRoster()
    return NextResponse.json({ rows })
  } catch (error) {
    console.error("Failed to read demodesk roster:", error)
    return NextResponse.json({ error: "Failed to read roster" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    if (!body || !Array.isArray(body.rows)) {
      return NextResponse.json({ error: "Expected { rows: [] }" }, { status: 400 })
    }

    const rows: RosterRow[] = body.rows.map((row: Partial<RosterRow>) => ({
      host: typeof row.host === "string" ? row.host.trim() : "",
      region: typeof row.region === "string" ? row.region.trim() : "",
      interest: typeof row.interest === "string" ? row.interest.trim() : "",
      url: typeof row.url === "string" ? row.url.trim() : "",
      notes: typeof row.notes === "string" ? row.notes.trim() : "",
    }))

    await fs.writeFile(rosterPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8")
    return NextResponse.json({ ok: true, count: rows.length })
  } catch (error) {
    console.error("Failed to save demodesk roster:", error)
    return NextResponse.json({ error: "Failed to save roster" }, { status: 500 })
  }
}
