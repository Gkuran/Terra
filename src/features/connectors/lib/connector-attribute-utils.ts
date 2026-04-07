import type { GeoJsonProperties } from 'geojson'

export function readCandidate(
  properties: GeoJsonProperties | null | undefined,
  candidates: string[],
) {
  if (!properties) {
    return null
  }

  for (const [key, value] of Object.entries(properties)) {
    if (
      candidates.includes(key.toLowerCase()) &&
      value !== null &&
      value !== undefined &&
      `${value}`.trim() !== ''
    ) {
      return `${value}`
    }
  }

  return null
}

export function stringifyAttributes(
  properties: GeoJsonProperties | null | undefined,
) {
  const attributes: Record<string, string> = {}

  if (!properties) {
    return attributes
  }

  for (const [key, value] of Object.entries(properties)) {
    if (value === null || value === undefined || `${value}`.trim() === '') {
      continue
    }

    attributes[key] = typeof value === 'string' ? value : JSON.stringify(value)
  }

  return attributes
}
