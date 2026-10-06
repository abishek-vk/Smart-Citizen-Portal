import { useListCitizens } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { MapPin, Mail, Phone, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function AdminCitizens() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useListCitizens({
    search: search.trim() || undefined,
    page,
    limit: 20,
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Citizen Directory" description="Browse and search citizen accounts." />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name or email..." 
          className="pl-9 bg-card"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : isError ? (
          <div role="alert" className="py-12 text-center text-sm text-destructive">
            Unable to load citizens: {error.message}
            <Button className="ml-3" size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No citizens found.</div>
        ) : data?.data.map((citizen) => (
          <Card key={citizen.id}>
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarImage src={citizen.avatarUrl || ''} />
                <AvatarFallback className="bg-primary/5 text-primary text-xl font-medium">
                  {citizen.firstName?.[0]}{citizen.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <h3 className="font-bold font-serif text-lg">{citizen.firstName} {citizen.lastName}</h3>
                  {citizen.role !== 'citizen' && <Badge className="bg-primary text-primary-foreground text-[10px]">{citizen.role === "super_admin" ? "Super Admin" : "Admin"}</Badge>}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {citizen.email}</span>
                  {citizen.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {citizen.phone}</span>}
                  {citizen.city && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {citizen.city}</span>}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground mb-1">Registered</p>
                <p className="font-medium text-sm">{format(new Date(citizen.createdAt), 'MMM d, yyyy')}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{data.pagination.total} citizens · Page {page} of {data.pagination.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(current => current + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
