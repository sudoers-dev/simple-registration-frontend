import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const BASE_DATA = [
  { week: "Week 1", registrations: 12 },
  { week: "Week 2", registrations: 28 },
  { week: "Week 3", registrations: 19 },
  { week: "Week 4", registrations: 35 },
  { week: "Week 5", registrations: 22 },
  { week: "Week 6", registrations: 41 },
  { week: "Week 7", registrations: 30 },
  { week: "Week 8", registrations: 17 },
]

const chartConfig = {
  registrations: {
    label: "Registrations",
    color: "var(--primary)",
  },
} satisfies ChartConfig

type Props = { newCount: number }

export function RegistrationChart({ newCount }: Props) {
  const data = useMemo(() => {
    const copy = BASE_DATA.map((d) => ({ ...d }))
    copy[copy.length - 1].registrations += newCount
    return copy
  }, [newCount])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Weekly Registrations</CardTitle>
        <CardDescription>Total number of registrations per week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-44 w-full">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="registrations"
              fill="var(--color-registrations)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
