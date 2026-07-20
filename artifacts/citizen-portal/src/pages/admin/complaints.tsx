import { useListComplaints, useUpdateComplaint, useAnalyzeComplaint } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { useQueryClient } from "@tanstack/react-query"
import { getListComplaintsQueryKey } from "@workspace/api-client-react"
import { useToast } from "@/hooks/use-toast"
import { Sparkles, MapPin, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function AdminComplaints() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<any>(undefined)
  
  const { data, isLoading } = useListComplaints({ 
    search: search || undefined, 
    status: statusFilter !== 'all' ? statusFilter : undefined 
  })
  
  const updateMutation = useUpdateComplaint()
  const analyzeMutation = useAnalyzeComplaint()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleStatusChange = (id: string, newStatus: any) => {
    updateMutation.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: "Status updated" })
        queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey() })
      }
    })
  }

  const handleAnalyze = (id: string) => {
    analyzeMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Analysis complete" })
        queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey() })
      }
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Complaints" description="Triage, analyze, and resolve citizen issues." />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search tickets, locations..." 
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : data?.data.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No complaints found.</div>
        ) : data?.data.map((complaint) => (
          <Card key={complaint.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                <div className="p-6 flex-1 border-r">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">#{complaint.id.slice(0,6)}</span>
                      <h3 className="font-bold font-serif text-lg">{complaint.title}</h3>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{complaint.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {complaint.location}</span>
                    <span>Reported: {format(new Date(complaint.createdAt), 'MMM d, h:mm a')}</span>
                    <span className="capitalize">Category: {complaint.category.replace('_', ' ')}</span>
                  </div>

                  {complaint.aiCategory && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 flex gap-3">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium text-primary">AI Analysis: </span>
                        Suggested department: <span className="font-medium">{complaint.aiCategory}</span>. 
                        Est. resolution: {complaint.estimatedResolution}. 
                        <span className="text-muted-foreground ml-1">({Math.round((complaint.aiConfidence || 0)*100)}% confidence)</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-6 lg:w-64 bg-muted/20 flex flex-col justify-between gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Status</label>
                    <Select value={complaint.status} onValueChange={(v) => handleStatusChange(complaint.id, v)}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {!complaint.aiCategory && (
                    <Button 
                      variant="outline" 
                      className="w-full gap-2" 
                      onClick={() => handleAnalyze(complaint.id)}
                      disabled={analyzeMutation.isPending && analyzeMutation.variables?.id === complaint.id}
                    >
                      <Sparkles className="w-4 h-4" /> Run AI Analysis
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
