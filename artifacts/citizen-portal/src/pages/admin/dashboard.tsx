import { useGetAdminDashboard } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Users, AlertCircle, TrendingUp, IndianRupee } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts"
import { format, parseISO } from "date-fns"
import { CountUp, Stagger, StaggerItem } from "@/components/motion"

const COLORS = [1, 2, 3, 4, 5].map((i) => `hsl(var(--chart-${i}))`);

export default function AdminDashboard() {
  const { data, isLoading, isError, error, refetch } = useGetAdminDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Command Center" description="Loading metrics..." />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Command Center" description="City operations and performance overview." />
        <div role="alert" className="rounded-lg border border-destructive/30 p-6 text-sm text-destructive">
          <p>Unable to load admin dashboard: {error?.message ?? "Dashboard data is unavailable."}</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Command Center" 
        description="City operations and performance overview."
      />

      <Stagger inView={false} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
        <Card className="grain relative h-full overflow-hidden border-none bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-primary-foreground/80 font-medium text-sm">Total Citizens</p>
                <h3 className="mt-3 font-display text-4xl font-normal tracking-[-0.04em]"><CountUp value={data.totalCitizens} /></h3>
              </div>
              <div className="rounded-xl bg-primary-foreground/12 p-3 text-secondary"><Users className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>
        </StaggerItem>
        
        <StaggerItem>
        <Card className="h-full">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground font-medium text-sm">Active Complaints</p>
                <h3 className="mt-3 font-display text-4xl font-normal tracking-[-0.04em]"><CountUp value={data.totalComplaints} /></h3>
                <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary">
                  <TrendingUp className="w-3 h-3" /> {data.resolvedComplaintsToday} resolved today
                </p>
              </div>
              <div className="rounded-xl bg-secondary/15 p-3 text-secondary-foreground dark:text-secondary"><AlertCircle className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>
        </StaggerItem>

        <StaggerItem>
        <Card className="h-full">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground font-medium text-sm">Revenue Today</p>
                <h3 className="mt-3 font-display text-4xl font-normal tracking-[-0.04em]"><CountUp value={data.totalRevenue / 1000} format={(n) => `₹${n.toFixed(1)}k`} /></h3>
              </div>
              <div className="rounded-xl bg-accent p-3 text-accent-foreground"><IndianRupee className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>
        </StaggerItem>

        <StaggerItem>
        <Card className="h-full">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground font-medium text-sm">Pending Certificates</p>
                <h3 className="mt-3 font-display text-4xl font-normal tracking-[-0.04em]"><CountUp value={data.pendingCertificates} /></h3>
              </div>
              <div className="rounded-xl bg-sky-500/12 p-3 text-sky-700 dark:text-sky-400"><AlertCircle className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>
        </StaggerItem>
      </Stagger>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Citizen Growth</CardTitle>
            <CardDescription>30-day registration trend</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.citizenGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={(v) => format(parseISO(v), 'MMM d')} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: 12 }}
                  labelFormatter={(v) => format(parseISO(String(v)), 'MMM d, yyyy')}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complaints by Status</CardTitle>
            <CardDescription>Current distribution of issues</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.complaintsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  cornerRadius={4}
                  stroke="none"
                  dataKey="count"
                  nameKey="status"
                >
                  {data.complaintsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <Legend verticalAlign="bottom" height={36} formatter={(value, entry: any) => <span className="capitalize text-sm text-foreground">{String(value || entry?.payload?.status || entry?.value || '').replace(/_/g, ' ')}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Collections by payment type</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByType} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <YAxis dataKey="type" type="category" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => String(v || '').replace(/_/g, ' ')} width={100} className="capitalize" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: 12 }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={(v) => <span className="capitalize">{String(v || '').replace(/_/g, ' ')}</span>}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} barSize={28}>
                  {data.revenueByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
