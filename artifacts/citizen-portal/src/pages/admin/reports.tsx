import { useGetRevenueReport, useGetServicesReport } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Percent, IndianRupee, Activity } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { format, parseISO } from "date-fns"

export default function AdminReports() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const { data: revenue, isLoading: loadingRev, isError: revenueError, error: revenueErrorDetails, refetch: retryRevenue } = useGetRevenueReport({ period })
  const { data: services, isLoading: loadingServ, isError: servicesError, error: servicesErrorDetails, refetch: retryServices } = useGetServicesReport()

  if (loadingRev || loadingServ) {
    return (
      <div className="space-y-6">
        <PageHeader title="City Reports" description="Financial and service metrics." />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (revenueError || servicesError || !revenue || !services) {
    return (
      <div className="space-y-6">
        <PageHeader title="City Reports" description="Financial and service metrics." />
        <div role="alert" className="rounded-lg border border-destructive/30 p-6 text-sm text-destructive">
          <p>
            Unable to load reports: {revenueErrorDetails?.message ?? servicesErrorDetails?.message ?? "Report data is unavailable."}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => retryRevenue()}>Retry revenue report</Button>
            <Button variant="outline" size="sm" onClick={() => retryServices()}>Retry service report</Button>
          </div>
        </div>
      </div>
    )
  }

  const percentage = (numerator: number, denominator: number) =>
    denominator > 0 ? Math.round(numerator / denominator * 100) : 0
  const formatCurrency = (value: number) =>
    `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
  const revenueData = [
    { name: 'Property Tax', amount: revenue.propertyTaxRevenue },
    { name: 'Water Tax', amount: revenue.waterTaxRevenue },
    { name: 'Parking', amount: revenue.parkingRevenue },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="City Reports" description="Financial and service metrics." />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Revenue and service metrics for the selected period.</p>
        <Select value={period} onValueChange={(value: "7d" | "30d" | "90d" | "1y") => setPeriod(value)}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Report period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-6">
            <IndianRupee className="w-6 h-6 mb-4 opacity-75" />
            <h3 className="text-3xl font-bold font-serif">{formatCurrency(revenue.totalRevenue)}</h3>
            <p className="text-primary-foreground/80 mt-1">Revenue in selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Percent className="w-6 h-6 mb-4 text-emerald-500" />
            <h3 className="text-3xl font-bold font-serif">{revenue.collectionRate.toFixed(1)}%</h3>
            <p className="text-muted-foreground mt-1">Tax payment collection rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Activity className="w-6 h-6 mb-4 text-sky-500" />
            <h3 className="text-3xl font-bold font-serif">{services.complaints.total.toLocaleString()}</h3>
            <p className="text-muted-foreground mt-1">Total Service Requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue.revenueByPeriod}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={value => format(parseISO(value), period === "1y" ? "MMM yy" : "MMM d")}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={value => `₹${value / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ borderRadius: "8px" }}
                  labelFormatter={value => format(parseISO(String(value)), period === "1y" ? "MMMM yyyy" : "MMM d, yyyy")}
                  formatter={value => formatCurrency(Number(value ?? 0))}
                />
                <Bar dataKey="value" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Output Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Complaints Resolution</span>
                  <span className="text-muted-foreground">{percentage(services.complaints.resolved, services.complaints.total)}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${percentage(services.complaints.resolved, services.complaints.total)}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Certificates Approved</span>
                  <span className="text-muted-foreground">{percentage(services.certificates.approved, services.certificates.total)}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500" style={{ width: `${percentage(services.certificates.approved, services.certificates.total)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Garbage Pickups Completed</span>
                  <span className="text-muted-foreground">{percentage(services.garbage.completed, services.garbage.total)}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${percentage(services.garbage.completed, services.garbage.total)}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
