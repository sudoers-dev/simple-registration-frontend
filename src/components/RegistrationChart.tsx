import { useState, useEffect, useCallback, useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { fetchRegistrants, type Registrant } from "@/store/registrants"

type Granularity = "day" | "week" | "month" | "year"

const GRANULARITIES: Granularity[] = ["day", "week", "month", "year"]

const chartConfig = {
  registrations: { label: "Registrations", color: "var(--primary)" },
} satisfies ChartConfig

// ── helpers ──────────────────────────────────────────────────────────────────

function startOf(g: Granularity, offset: number): Date {
  const d = new Date()
  if (g === "day") {
    d.setDate(d.getDate() + offset)
    d.setHours(0, 0, 0, 0)
  } else if (g === "week") {
    const day = d.getDay()
    d.setDate(d.getDate() - day + offset * 7)
    d.setHours(0, 0, 0, 0)
  } else if (g === "month") {
    d.setMonth(d.getMonth() + offset, 1)
    d.setHours(0, 0, 0, 0)
  } else {
    d.setFullYear(d.getFullYear() + offset, 0, 1)
    d.setHours(0, 0, 0, 0)
  }
  return d
}

function endOf(g: Granularity, start: Date): Date {
  const d = new Date(start)
  if (g === "day") {
    d.setHours(23, 59, 59, 999)
  } else if (g === "week") {
    d.setDate(d.getDate() + 6)
    d.setHours(23, 59, 59, 999)
  } else if (g === "month") {
    d.setMonth(d.getMonth() + 1, 0)
    d.setHours(23, 59, 59, 999)
  } else {
    d.setFullYear(d.getFullYear(), 11, 31)
    d.setHours(23, 59, 59, 999)
  }
  return d
}

function bucketKey(g: Granularity, date: Date): string {
  if (g === "day") {
    return date.toLocaleTimeString([], { hour: "2-digit", hour12: true })
  }
  if (g === "week") {
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  }
  if (g === "month") {
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }
  return date.toLocaleDateString([], { month: "short", year: "numeric" })
}

function buildBuckets(g: Granularity, start: Date, end: Date): Map<string, number> {
  const map = new Map<string, number>()
  const cursor = new Date(start)

  if (g === "day") {
    for (let h = 0; h < 24; h++) {
      cursor.setHours(h, 0, 0, 0)
      map.set(bucketKey(g, cursor), 0)
    }
  } else if (g === "week") {
    while (cursor <= end) {
      map.set(bucketKey(g, cursor), 0)
      cursor.setDate(cursor.getDate() + 1)
    }
  } else if (g === "month") {
    while (cursor <= end) {
      map.set(bucketKey(g, cursor), 0)
      cursor.setDate(cursor.getDate() + 1)
    }
  } else {
    while (cursor <= end) {
      map.set(bucketKey(g, cursor), 0)
      cursor.setMonth(cursor.getMonth() + 1)
    }
  }
  return map
}

function assignToBucket(g: Granularity, date: Date): string {
  if (g === "day") {
    const h = new Date(date)
    h.setMinutes(0, 0, 0)
    return h.toLocaleTimeString([], { hour: "2-digit", hour12: true })
  }
  if (g === "week" || g === "month") {
    return date.toLocaleDateString([], { weekday: g === "week" ? "short" : undefined, month: "short", day: "numeric" })
  }
  return date.toLocaleDateString([], { month: "short", year: "numeric" })
}

function periodLabel(g: Granularity, offset: number): string {
  const start = startOf(g, offset)
  if (g === "day") return start.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  if (g === "week") {
    const end = endOf(g, start)
    return `${start.toLocaleDateString([], { month: "short", day: "numeric" })} – ${end.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`
  }
  if (g === "month") return start.toLocaleDateString([], { month: "long", year: "numeric" })
  return String(start.getFullYear())
}

// ── component ─────────────────────────────────────────────────────────────────

type Props = { refreshKey?: number }

export function RegistrationChart({ refreshKey }: Props) {
  const [granularity, setGranularity] = useState<Granularity>("month")
  const [offset, setOffset] = useState(0)
  const [registrants, setRegistrants] = useState<Registrant[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRegistrants(await fetchRegistrants())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  // Reset offset to 0 when granularity changes
  const handleGranularity = (g: Granularity) => {
    setGranularity(g)
    setOffset(0)
  }

  const chartData = useMemo(() => {
    const start = startOf(granularity, offset)
    const end = endOf(granularity, start)
    const buckets = buildBuckets(granularity, start, end)

    for (const r of registrants) {
      const d = new Date(r.registeredAt)
      if (d >= start && d <= end) {
        const key = assignToBucket(granularity, d)
        if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
      }
    }

    return Array.from(buckets.entries()).map(([label, registrations]) => ({ label, registrations }))
  }, [registrants, granularity, offset])

  const total = useMemo(() => chartData.reduce((s, d) => s + d.registrations, 0), [chartData])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Registrations</CardTitle>
        <CardDescription>{periodLabel(granularity, offset)} · {total} total</CardDescription>
        <CardAction>
          <div className="flex items-center gap-1">
            {/* Granularity tabs */}
            <div className="flex rounded-lg border border-input overflow-hidden mr-2">
              {GRANULARITIES.map((g) => (
                <button
                  key={g}
                  onClick={() => handleGranularity(g)}
                  className={`px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    granularity === g
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {/* Back / forward */}
            <Button variant="ghost" size="icon-sm" onClick={() => setOffset((o) => o - 1)} aria-label="Previous period">
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setOffset((o) => o + 1)} disabled={offset >= 0} aria-label="Next period">
              <ChevronRight />
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-44 flex items-center justify-center">
            <Spinner className="size-5" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-44 w-full">
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="registrations" fill="var(--color-registrations)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
