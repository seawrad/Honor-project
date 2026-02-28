/**
 * AI image generation for run memory cards.
 * Uses placeholdr.dev (free, no API key) to generate scenic images from run context.
 */
import { db } from '../database/db.js'
import { RouteService } from './route.service.js'

const PLACEHOLDR_BASE = 'https://placeholdr.dev'

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'RunCrew-GroupRunningApp/1.0',
        },
      }
    )
    const data = await res.json()
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

async function getLocationFromActivity(activityId: string): Promise<string | null> {
  const result = await db.query(
    `SELECT address, latitude, longitude FROM activities WHERE id = $1`,
    [activityId]
  )
  if (result.rows.length === 0) return null
  const row = result.rows[0] as { address?: string; latitude: number; longitude: number }
  if (row.address && row.address.trim().length > 0) {
    return row.address
  }
  return reverseGeocode(parseFloat(String(row.latitude)), parseFloat(String(row.longitude)))
}

async function getLocationFromRoute(routeId: string): Promise<string | null> {
  const positions = await RouteService.getRoutePositions(routeId)
  if (positions.length === 0) return null
  const mid = Math.floor(positions.length / 2)
  const pos = positions[mid] as { latitude: number; longitude: number }
  return reverseGeocode(pos.latitude, pos.longitude)
}

function buildImagePrompt(location: string, weatherDesc?: string): string {
  const weather = weatherDesc ? `, ${weatherDesc} weather` : ''
  return `scenic running path view at ${location}${weather}, beautiful landscape photography, photorealistic`
}

/**
 * Generate AI image URL for a memory card based on run context.
 * Uses placeholdr.dev - free, no API key required.
 */
export async function generateMemoryCardImageUrl(
  activityId: string | null,
  routeId: string | null,
  weatherDesc?: string,
  locationHint?: string
): Promise<string | null> {
  let location: string | null = locationHint || null

  if (!location && activityId) {
    location = await getLocationFromActivity(activityId)
  }
  if (!location && routeId) {
    location = await getLocationFromRoute(routeId)
  }
  if (!location) {
    location = 'a scenic park'
  }

  const prompt = buildImagePrompt(location, weatherDesc)
  const safePrompt = prompt.slice(0, 150)
  const encoded = encodeURIComponent(safePrompt)
  return `${PLACEHOLDR_BASE}/600x400/${encoded}?style=photographic`
}
