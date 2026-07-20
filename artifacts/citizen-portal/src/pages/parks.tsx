import { PageHeader } from "@/components/layout/main-layout"
import { useListParks } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TreePine, Clock, MapPin } from "lucide-react"

export default function Parks() {
  const { data, isLoading } = useListParks()

  return (
    <div className="space-y-6">
      <PageHeader 
        title="City Parks & Recreation" 
        description="Explore green spaces and recreational facilities."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : data?.map((park) => (
          <Card key={park.id} className="overflow-hidden hover-elevate">
            <div className="h-40 bg-emerald-900/10 flex items-center justify-center border-b">
              {park.imageUrl ? (
                <img src={park.imageUrl} alt={park.name} className="w-full h-full object-cover" />
              ) : (
                <TreePine className="w-16 h-16 text-emerald-600/20" />
              )}
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-xl font-serif">{park.name}</h3>
                <Badge variant={park.isActive ? 'default' : 'secondary'}>
                  {park.isActive ? 'Open' : 'Closed'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{park.description}</p>
              
              <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {park.address}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {park.openingTime} - {park.closingTime}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {park.amenities.map(amenity => (
                  <Badge key={amenity} variant="outline" className="bg-muted/50 font-normal">{amenity}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
