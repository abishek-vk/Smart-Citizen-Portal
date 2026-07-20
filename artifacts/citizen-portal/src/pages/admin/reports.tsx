import { useGetRevenueReport, useGetServicesReport } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { FileText, Percent, DollarSign, Activity } from "lucide-react"

export default function AdminReports() {
  const { data: revenue, isLoading: loadingRev } = useGetRevenueReport()
  const { data: services, isLoading: loadingServ } = useGetServicesReport()

  if (loadingRev || loadingServ || !revenue || !services) {
    return (
      <div className="space-y-6">
        <PageHeader title="City Reports" description="Financial and service metrics." />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const revenueData = [
    { name: 'Property Tax', amount: revenue.propertyTaxRevenue },
    { name: 'Water Tax', amount: revenue.waterTaxRevenue },
    { name: 'Parking', amount: revenue.parkingRevenue },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="City Reports" description="Financial and service metrics." />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-6">
            <DollarSign className="w-6 h-6 mb-4 opacity-75" />
            <h3 className="text-3xl font-bold font-serif">${(revenue.totalRevenue/1000000).toFixed(2)}M</h3>
            <p className="text-primary-foreground/80 mt-1">Total Revenue YTD</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Percent className="w-6 h-6 mb-4 text-emerald-500" />
            <h3 className="text-3xl font-bold font-serif">{revenue.collectionRate}%</h3>
            <p className="text-muted-foreground mt-1">Tax Collection Rate</p>
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
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} formatter={(v:number) => `$${v.toLocaleString()}`} />
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
                  <span className="text-muted-foreground">{(services.complaints.resolved / services.complaints.total * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(services.complaints.resolved / services.complaints.total * 100)}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Certificates Approved</span>
                  <span className="text-muted-foreground">{(services.certificates.approved / services.certificates.total * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500" style={{ width: `${(services.certificates.approved / services.certificates.total * 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Garbage Pickups Completed</span>
                  <span className="text-muted-foreground">{(services.garbage.completed / services.garbage.total * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(services.garbage.completed / services.garbage.total * 100)}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
