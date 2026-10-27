import { useCallback, useEffect, useState } from "react"

// Districts with seeded parking, parks, library and transport data.
// `center` is the district headquarters, used as the starting point for park directions.
export const DISTRICTS = [
  { name: "Chennai", center: [13.0827, 80.2707] },
  { name: "Coimbatore", center: [11.0168, 76.9558] },
  { name: "Madurai", center: [9.9252, 78.1198] },
  { name: "Tiruchirappalli", center: [10.7905, 78.7047] },
  { name: "Salem", center: [11.6643, 78.146] },
  { name: "Tirunelveli", center: [8.7139, 77.7567] },
  { name: "Thanjavur", center: [10.787, 79.1378] },
  { name: "Vellore", center: [12.9165, 79.1325] },
  { name: "Erode", center: [11.341, 77.7172] },
  { name: "Kanyakumari", center: [8.1833, 77.4119] },
] as const satisfies readonly { name: string; center: readonly [number, number] }[]

export type DistrictName = (typeof DISTRICTS)[number]["name"]

const STORAGE_KEY = "smartcity.district"
const CHANGE_EVENT = "smartcity:district-change"
const DEFAULT_DISTRICT: DistrictName = "Chennai"

const isDistrict = (value: unknown): value is DistrictName =>
  DISTRICTS.some((d) => d.name === value)

function readStoredDistrict(): DistrictName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isDistrict(stored)) return stored
  } catch {
    // Storage can be unavailable (private mode, blocked site data)
  }
  return DEFAULT_DISTRICT
}

export function getDistrictCenter(name: string | null | undefined): [number, number] {
  const match = DISTRICTS.find((d) => d.name === name) ?? DISTRICTS[0]
  return [match.center[0], match.center[1]]
}

/** The selected district, remembered across pages and visits. */
export function useDistrict(): [DistrictName, (district: DistrictName) => void] {
  const [district, setDistrictState] = useState<DistrictName>(readStoredDistrict)

  useEffect(() => {
    const sync = () => setDistrictState(readStoredDistrict())
    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const setDistrict = useCallback((next: DistrictName) => {
    setDistrictState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Selection still applies for this page view
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return [district, setDistrict]
}
