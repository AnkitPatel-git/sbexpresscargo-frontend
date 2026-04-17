import { NextResponse } from "next/server"

type GeoPoint = {
  lat: number
  lon: number
}

type NominatimResult = {
  lat?: string
  lon?: string
  address?: {
    postcode?: string
  }
}

type OsrmRouteResponse = {
  routes?: Array<{
    distance?: number
  }>
}

type DistanceData = {
  fromPinCode: string
  toPinCode: string
  distanceKm: number
  source: "osrm" | "haversine"
}

type CachedDistance = {
  distanceKm: number
  source: DistanceData["source"]
}

const USER_AGENT = "sbexpresscargo-frontend/1.0"
const pinPointCache = new Map<string, GeoPoint>()
const pairCache = new Map<string, CachedDistance>()

function normalizePinCode(value: string | null) {
  return (value ?? "").replace(/\s+/g, "").trim()
}

function isValidIndianPinCode(value: string) {
  return /^\d{6}$/.test(value)
}

function pairKey(fromPinCode: string, toPinCode: string) {
  return [fromPinCode, toPinCode].sort().join(":")
}

function haversineKm(from: GeoPoint, to: GeoPoint) {
  const earthRadiusKm = 6371
  const toRadians = (value: number) => (value * Math.PI) / 180

  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLon = toRadians(to.lon - from.lon)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a))
}

async function geocodePincode(pinCode: string): Promise<GeoPoint> {
  const cached = pinPointCache.get(pinCode)
  if (cached) return cached

  const candidates = [
    (() => {
      const url = new URL("https://nominatim.openstreetmap.org/search")
      url.searchParams.set("postalcode", pinCode)
      url.searchParams.set("country", "India")
      url.searchParams.set("countrycodes", "in")
      url.searchParams.set("format", "jsonv2")
      url.searchParams.set("limit", "5")
      url.searchParams.set("addressdetails", "1")
      return url
    })(),
    (() => {
      const url = new URL("https://nominatim.openstreetmap.org/search")
      url.searchParams.set("q", `${pinCode}, India`)
      url.searchParams.set("countrycodes", "in")
      url.searchParams.set("format", "jsonv2")
      url.searchParams.set("limit", "5")
      url.searchParams.set("addressdetails", "1")
      return url
    })(),
    (() => {
      const url = new URL("https://nominatim.openstreetmap.org/search")
      url.searchParams.set("q", pinCode)
      url.searchParams.set("countrycodes", "in")
      url.searchParams.set("format", "jsonv2")
      url.searchParams.set("limit", "5")
      url.searchParams.set("addressdetails", "1")
      return url
    })(),
  ]

  for (const url of candidates) {
    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      continue
    }

    const results = (await response.json()) as NominatimResult[]
    const match =
      results.find((item) => normalizePinCode(item.address?.postcode ?? "") === pinCode) ??
      results[0]

    const point = {
      lat: Number(match?.lat),
      lon: Number(match?.lon),
    }

    if (Number.isFinite(point.lat) && Number.isFinite(point.lon)) {
      pinPointCache.set(pinCode, point)
      return point
    }
  }

  throw new Error(`No geocoding result found for pincode ${pinCode}`)
}

async function routeDistanceKm(from: GeoPoint, to: GeoPoint): Promise<number> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": USER_AGENT,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("OSRM routing failed")
  }

  const data = (await response.json()) as OsrmRouteResponse
  const distanceMeters = data.routes?.[0]?.distance

  if (!Number.isFinite(distanceMeters)) {
    throw new Error("OSRM returned an empty route")
  }

  return distanceMeters / 1000
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const fromPinCode = normalizePinCode(url.searchParams.get("fromPinCode"))
  const toPinCode = normalizePinCode(url.searchParams.get("toPinCode"))

  if (!isValidIndianPinCode(fromPinCode) || !isValidIndianPinCode(toPinCode)) {
    return NextResponse.json(
      {
        success: false,
        message: "Both pincodes must be valid 6-digit Indian pincodes",
      },
      { status: 400 }
    )
  }

  if (fromPinCode === toPinCode) {
    const payload: DistanceData = {
      fromPinCode,
      toPinCode,
      distanceKm: 0,
      source: "haversine",
    }
    return NextResponse.json({ success: true, data: payload })
  }

  const key = pairKey(fromPinCode, toPinCode)
  const cached = pairCache.get(key)
  if (cached) {
    return NextResponse.json({
      success: true,
      data: {
        fromPinCode,
        toPinCode,
        distanceKm: cached.distanceKm,
        source: cached.source,
      } satisfies DistanceData,
    })
  }

  try {
    const [fromPoint, toPoint] = await Promise.all([geocodePincode(fromPinCode), geocodePincode(toPinCode)])

    let distanceKm: number
    let source: DistanceData["source"] = "osrm"

    try {
      distanceKm = await routeDistanceKm(fromPoint, toPoint)
    } catch {
      distanceKm = haversineKm(fromPoint, toPoint)
      source = "haversine"
    }

    const payload: DistanceData = {
      fromPinCode,
      toPinCode,
      distanceKm: Number(distanceKm.toFixed(2)),
      source,
    }

    pairCache.set(key, {
      distanceKm: payload.distanceKm,
      source: payload.source,
    })

    return NextResponse.json({ success: true, data: payload })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to calculate distance"
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 }
    )
  }
}
