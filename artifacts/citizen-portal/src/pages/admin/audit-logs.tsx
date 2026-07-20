import { useListAuditLogs } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { Database, ShieldAlert, Key } from "lucide-react"

export default function AdminAuditLogs() {
  const { data, isLoading } = useListAuditLogs()

  return (
    <div className="space-y-6">
      <PageHeader title="System Audit Logs" description="Security and access records." />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="divide-y text-sm">
              <div className="p-4 bg-muted/50 grid grid-cols-12 gap-4 font-semibold text-muted-foreground">
                <div className="col-span-3">Timestamp</div>
                <div className="col-span-2">Action</div>
                <div className="col-span-3">Entity</div>
                <div className="col-span-4">User ID / IP</div>
              </div>
              {data?.data.map(log => (
                <div key={log.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-muted/30">
                  <div className="col-span-3 text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                  </div>
                  <div className="col-span-2 font-medium">
                    {log.action}
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-muted-foreground" />
                    {log.entity} {log.entityId && <span className="text-muted-foreground text-xs">({log.entityId.slice(0,8)})</span>}
                  </div>
                  <div className="col-span-4 flex items-center gap-2 text-xs font-mono bg-muted px-2 py-1 rounded w-fit text-muted-foreground">
                    <Key className="w-3 h-3" /> {log.userId || log.ipAddress || 'System'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
