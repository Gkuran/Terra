import type { MapBoundingBox } from '@/features/map/types/map-bounding-box'
import { searchMacrostratGeologyByBbox } from '@/features/connectors/bbox/lib/search-macrostrat-geology-by-bbox'
import { searchOccurrencesByBbox } from '@/features/connectors/bbox/lib/search-occurrences-by-bbox'

export interface AreaDataSearchRequest {
  bbox: MapBoundingBox
  includeGbif: boolean
  includeMacrostrat: boolean
}

export interface AreaDataSearchResult {
  gbif: Awaited<ReturnType<typeof searchOccurrencesByBbox>> | null
  macrostrat: Awaited<ReturnType<typeof searchMacrostratGeologyByBbox>> | null
  warnings: string[]
}

export async function searchAreaDataByBbox(
  request: AreaDataSearchRequest,
): Promise<AreaDataSearchResult> {
  if (!request.includeGbif && !request.includeMacrostrat) {
    throw new Error('Select at least one source for the area query.')
  }

  const [gbifResult, macrostratResult] = await Promise.allSettled([
    request.includeGbif
      ? searchOccurrencesByBbox(request.bbox)
      : Promise.resolve(null),
    request.includeMacrostrat
      ? searchMacrostratGeologyByBbox(request.bbox)
      : Promise.resolve(null),
  ])

  const warnings: string[] = []

  const gbif =
    gbifResult.status === 'fulfilled'
      ? gbifResult.value
      : (() => {
          if (
            gbifResult.reason instanceof Error &&
            !gbifResult.reason.message.includes('No georeferenced')
          ) {
            warnings.push(gbifResult.reason.message)
          }

          return null
        })()

  const macrostrat =
    macrostratResult.status === 'fulfilled'
      ? macrostratResult.value
      : (() => {
          if (
            macrostratResult.reason instanceof Error &&
            !macrostratResult.reason.message.includes('No Macrostrat geologic units')
          ) {
            warnings.push(macrostratResult.reason.message)
          }

          return null
        })()

  if (!gbif && !macrostrat) {
    const fallbackMessage =
      request.includeGbif && request.includeMacrostrat
        ? 'No fauna, flora, or Macrostrat geologic units were found for the selected area.'
        : request.includeGbif
          ? 'No fauna or flora occurrences were found for the selected area.'
          : 'No Macrostrat geologic units were found for the selected area.'

    throw new Error(warnings[0] ?? fallbackMessage)
  }

  return {
    gbif,
    macrostrat,
    warnings,
  }
}
