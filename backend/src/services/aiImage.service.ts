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

function buildImagePrompt(location: string, weatherDesc?: string, runDate?: string): string {
  const weather = weatherDesc ? `, ${weatherDesc} weather` : ''
  const dateStr = runDate
    ? `, ${new Date(runDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    : ''
  return `scenic running path view at ${location}${weather}${dateStr}, beautiful landscape photography, photorealistic`
}

/**
 * Deterministic seed for placeholdr (1-3) from run context so each card gets a different image.
 */
function getSeedFromContext(routeId: string | null, runDate: string, cardId: string): number {
  const str = `${routeId || ''}-${runDate}-${cardId}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return (Math.abs(hash) % 3) + 1
}

/**
 * Generate AI image URL for a memory card based on run context.
 * Uses placeholdr.dev - free, no API key required.
 * Adds runDate + seed to make each card's image unique.
 */
export async function generateMemoryCardImageUrl(
  activityId: string | null,
  routeId: string | null,
  weatherDesc?: string,
  locationHint?: string,
  runDate?: string,
  cardId?: string
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

  const prompt = buildImagePrompt(location, weatherDesc, runDate)
  const safePrompt = prompt.slice(0, 150)
  const encoded = encodeURIComponent(safePrompt)
  const seed = runDate && cardId ? getSeedFromContext(routeId, runDate, cardId) : 1
  return `${PLACEHOLDR_BASE}/600x400/${encoded}?style=photographic&seed=${seed}`
}
