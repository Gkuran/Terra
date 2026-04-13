import { z } from 'zod'

import type {
  OSMClimbingDiscipline,
  OSMClimbingElementType,
  OSMClimbingFeature,
} from '@/features/climbing-osm/types/osm-climbing-feature'

const overpassEndpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
] as const

const overpassElementSchema = z.object({
  type: z.enum(['node', 'way', 'relation']),
  id: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z
    .object({
      lat: z.number(),
      lon: z.number(),
    })
    .optional(),
  tags: z.record(z.string(), z.string()).default({}),
})

const overpassResponseSchema = z.object({
  elements: z.array(overpassElementSchema),
})

interface RequestOSMClimbingFeaturesInput {
  east: number
  north: number
  signal?: AbortSignal
  south: number
  west: number
}

function buildOverpassQuery({ east, north, south, west }: RequestOSMClimbingFeaturesInput) {
  const bbox = `${south},${west},${north},${east}`

  return `
[out:json][timeout:25];
(
  node["sport"="climbing"](${bbox});
  way["sport"="climbing"](${bbox});
  relation["sport"="climbing"](${bbox});
  node["climbing"~"^(area|crag|route|route_bottom|route_top|boulder)$"](${bbox});
  way["climbing"~"^(area|crag|route|route_bottom|route_top|boulder)$"](${bbox});
  relation["climbing"~"^(area|crag|route|route_bottom|route_top|boulder)$"](${bbox});
  node["climbing:boulder"="yes"](${bbox});
  way["climbing:boulder"="yes"](${bbox});
  relation["climbing:boulder"="yes"](${bbox});
);
out body center qt;
  `.trim()
}

function resolveDiscipline(tags: Record<string, string>): OSMClimbingDiscipline {
  if (tags['climbing:boulder'] === 'yes' || tags.climbing === 'boulder') {
    return 'bouldering'
  }

  if (tags.climbing === 'area') {
    return 'climbing-area'
  }

  if (tags.climbing === 'crag') {
    return 'crag'
  }

  if (
    tags.climbing === 'route' ||
    tags.climbing === 'route_bottom' ||
    tags.climbing === 'route_top'
  ) {
    return 'route'
  }

  if (tags.sport === 'climbing') {
    return 'climbing-site'
  }

  return 'climbing-site'
}

function resolveName(
  tags: Record<string, string>,
  discipline: OSMClimbingDiscipline,
  osmType: OSMClimbingElementType,
  osmId: number,
) {
  if (typeof tags.name === 'string' && tags.name.trim().length > 0) {
    return tags.name.trim()
  }

  if (typeof tags['name:pt'] === 'string' && tags['name:pt'].trim().length > 0) {
    return tags['name:pt'].trim()
  }

  switch (discipline) {
    case 'bouldering':
      return `Bouldering spot ${osmType}/${osmId}`
    case 'climbing-area':
      return `Climbing area ${osmType}/${osmId}`
    case 'crag':
      return `Crag ${osmType}/${osmId}`
    case 'route':
      return `Climbing route ${osmType}/${osmId}`
    default:
      return `Climbing site ${osmType}/${osmId}`
  }
}

function normalizeElement(
  element: z.infer<typeof overpassElementSchema>,
): OSMClimbingFeature | null {
  const coordinates =
    typeof element.lon === 'number' && typeof element.lat === 'number'
      ? ([element.lon, element.lat] as [number, number])
      : element.center
        ? ([element.center.lon, element.center.lat] as [number, number])
        : null

  if (!coordinates) {
    return null
  }

  const discipline = resolveDiscipline(element.tags)

  return {
    id: `${element.type}-${element.id}`,
    coordinates,
    discipline,
    name: resolveName(element.tags, discipline, element.type, element.id),
    osmId: element.id,
    osmType: element.type,
    tags: element.tags,
    url: `https://www.openstreetmap.org/${element.type}/${element.id}`,
  }
}

export async function requestOSMClimbingFeatures(
  input: RequestOSMClimbingFeaturesInput,
) {
  const query = buildOverpassQuery(input)
  const errors: string[] = []

  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        body: new URLSearchParams({
          data: query,
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        method: 'POST',
        signal: input.signal,
      })

      if (!response.ok) {
        const responseText = await response.text().catch(() => '')
        errors.push(
          `${endpoint} returned ${response.status}${responseText ? `: ${responseText.slice(0, 180)}` : ''}`,
        )
        continue
      }

      const parsed = overpassResponseSchema.parse((await response.json()) as unknown)
      const featuresById = new Map<string, OSMClimbingFeature>()

      parsed.elements.forEach((element) => {
        const normalized = normalizeElement(element)

        if (normalized) {
          featuresById.set(normalized.id, normalized)
        }
      })

      return [...featuresById.values()]
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }

      errors.push(error instanceof Error ? error.message : `Unknown request failure at ${endpoint}`)
    }
  }

  throw new Error(
    errors.length > 0
      ? `OSM climbing query failed. ${errors.join(' | ')}`
      : 'OSM climbing query failed.',
  )
}
