import { MapPin } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DISTRICTS, type DistrictName } from "@/lib/districts"

export function DistrictSelect({
  value,
  onChange,
}: {
  value: DistrictName
  onChange: (district: DistrictName) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DistrictName)}>
      <SelectTrigger className="w-[210px] bg-background" aria-label="District">
        <div className="flex min-w-0 items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {DISTRICTS.map((d) => (
          <SelectItem key={d.name} value={d.name}>
            {d.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
