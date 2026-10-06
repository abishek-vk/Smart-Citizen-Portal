import { useListAuditLogs } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Database, Key, Search, X } from "lucide-react"
import { FormEvent, useState } from "react"

export default function AdminAuditLogs() {
  const [action, setAction] = useState("")
  const [userId, setUserId] = useState("")
  const [filters, setFilters] = useState({ action: "", userId: "" })
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, isError, error, refetch } = useListAuditLogs({
    action: filters.action || undefined,
    userId: filters.userId || undefined,
    page,
    limit: 20,
  })

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setFilters({ action: action.trim(), userId: userId.trim() })
  }

  const clearFilters = () => {
    setAction("")
    setUserId("")
    setPage(1)
    setFilters({ action: "", userId: "" })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="System Audit Logs" description="Security and access records." />

      <form onSubmit={applyFilters} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-1.5 text-sm font-medium">
          Action
          <Input
            value={action}
            onChange={event => setAction(event.target.value)}
            placeholder="Filter by action..."
          />
        </label>
        <label className="grid flex-1 gap-1.5 text-sm font-medium">
          User ID
          <Input
            value={userId}
            onChange={event => setUserId(event.target.value)}
            placeholder="Filter by user ID..."
          />
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={isFetching}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button type="button" variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            Refresh
          </Button>
        </div>
      </form>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : isError ? (
            <div role="alert" className="p-8 text-center text-sm text-destructive">
              Unable to load audit logs: {error.message}
            </div>
          ) : data?.data.length === 0 ? (
            <div className="p-12 text-center">
              <Database className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No audit logs found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {filters.action || filters.userId
                  ? "Try changing or clearing the filters."
                  : "System activity will appear here when audit events are recorded."}
              </p>
            </div>
          ) : (
            <div className="divide-y text-sm">
              <div className="overflow-x-auto">
                <div className="min-w-[850px]">
                  <div className="grid grid-cols-12 gap-4 bg-muted/50 p-4 font-semibold text-muted-foreground">
                    <div className="col-span-3">Timestamp</div>
                    <div className="col-span-2">Action</div>
                    <div className="col-span-3">Entity</div>
                    <div className="col-span-2">User ID</div>
                    <div className="col-span-2">IP address</div>
                  </div>
                  {data?.data.map(log => (
                    <div key={log.id} className="border-t p-4 hover:bg-muted/30">
                      <div className="grid grid-cols-12 items-center gap-4">
                        <div className="col-span-3 whitespace-nowrap text-muted-foreground">
                          {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                        </div>
                        <div className="col-span-2 font-medium">{log.action}</div>
                        <div className="col-span-3 flex items-center gap-2">
                          <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{log.entity} {log.entityId && <span className="text-xs text-muted-foreground">({log.entityId.slice(0, 8)})</span>}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-2 break-all text-xs font-mono text-muted-foreground">
                          <Key className="h-3 w-3 shrink-0" />
                          {log.userId || "System"}
                        </div>
                        <div className="col-span-2 break-all text-xs font-mono text-muted-foreground">
                          {log.ipAddress || "—"}
                        </div>
                      </div>
                      {(log.userAgent || log.metadata) && (
                        <details className="mt-3 text-xs text-muted-foreground">
                          <summary className="w-fit cursor-pointer">More details</summary>
                          <div className="mt-2 space-y-2 rounded-md bg-muted/50 p-3">
                            {log.userAgent && <p><span className="font-medium">User agent:</span> {log.userAgent}</p>}
                            {log.metadata && (
                              <div>
                                <p className="font-medium">Metadata</p>
                                <pre className="mt-1 whitespace-pre-wrap break-all font-mono">{log.metadata}</pre>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {data?.pagination.total ?? 0} records
                  {data?.pagination.totalPages ? ` · Page ${data.pagination.page} of ${data.pagination.totalPages}` : ""}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage(current => current - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= (data?.pagination.totalPages ?? 0) || isFetching}
                    onClick={() => setPage(current => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
