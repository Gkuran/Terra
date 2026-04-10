import type { FeatureCollection, Point } from 'geojson'
import { z } from 'zod'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import {
  readCandidate,
  stringifyAttributes,
} from '@/features/connectors/lib/connector-attribute-utils'

const latitudeCandidates = ['latitude', 'lat', 'decimallatitude']
const longitudeCandidates = ['longitude', 'lon', 'lng', 'decimallongitude']
const titleCandidates = ['scientificname', 'scientific_name', 'species', 'name', 'nome', 'taxon']
const categoryCandidates = ['category', 'record_category']
const observedAtCandidates = ['eventdate', 'observedat', 'observed_at']
const scientificNameCandidates = ['scientificname', 'scientific_name', 'species']

const csvRowSchema = z.record(z.string(), z.string())
type CsvFeatureCategory = FeatureProperties['category']

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ''
  let isInsideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"') {
      if (isInsideQuotes && nextCharacter === '"') {
        current += '"'
        index += 1
      } else {
        isInsideQuotes = !isInsideQuotes
      }

      continue
    }

    if (character === ',' && !isInsideQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  values.push(current.trim())
  return values
}

function parseCsvRows(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('CSV input must include a header row and at least one record.')
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim())
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row = Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? '']),
    )

    return csvRowSchema.parse(row)
  })

  return { headers, rows }
}

function findHeader(headers: string[], candidates: string[]) {
  return (
    headers.find((header) => candidates.includes(header.toLowerCase())) ?? null
  )
}

export async function parseCsvToFeatures(
  file: File,
): Promise<FeatureCollection<Point, FeatureProperties>> {
  const csvText = await file.text()
  const { headers, rows } = parseCsvRows(csvText)
  const latitudeHeader = findHeader(headers, latitudeCandidates)
  const longitudeHeader = findHeader(headers, longitudeCandidates)

  if (!latitudeHeader || !longitudeHeader) {
    throw new Error('CSV must include latitude and longitude columns.')
  }

  const features = rows.flatMap((row, index) => {
    const latitude = Number(row[latitudeHeader])
    const longitude = Number(row[longitudeHeader])

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return []
    }

    const rawAttributes = stringifyAttributes(row)
    const title =
      readCandidate(row, titleCandidates) ?? `CSV feature ${index + 1}`
    const categoryCandidate = readCandidate(row, categoryCandidates)
    const normalizedCategory: CsvFeatureCategory =
      categoryCandidate === 'flora' ||
      categoryCandidate === 'fauna' ||
      categoryCandidate === 'biome' ||
      categoryCandidate === 'soil' ||
      categoryCandidate === 'geology' ||
      categoryCandidate === 'dataset'
        ? categoryCandidate
        : 'dataset'
    const scientificName =
      readCandidate(row, scientificNameCandidates) ?? undefined
    const observedAt =
      readCandidate(row, observedAtCandidates) ?? new Date().toISOString()

    return [
      {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [longitude, latitude],
        },
        properties: {
          ...row,
          id: `csv-feature-${index + 1}`,
          title,
          category: normalizedCategory,
          scientificName,
          biome: row.biome || row.habitat || 'Imported CSV',
          municipality: row.municipality || row.stateProvince || 'Not provided',
          status: 'stable' as const,
          summary: `Imported from ${file.name}.`,
          observedAt,
          datasetId: 'csv-connector',
          rawAttributes,
        },
      },
    ]
  })

  if (features.length === 0) {
    throw new Error('CSV parsing did not produce any valid georeferenced records.')
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}
