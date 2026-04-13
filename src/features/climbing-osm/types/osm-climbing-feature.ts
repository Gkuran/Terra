export type OSMClimbingElementType = 'node' | 'way' | 'relation'

export type OSMClimbingDiscipline =
  | 'bouldering'
  | 'climbing-area'
  | 'crag'
  | 'route'
  | 'climbing-site'

export interface OSMClimbingFeature {
  id: string
  coordinates: [number, number]
  discipline: OSMClimbingDiscipline
  name: string
  osmId: number
  osmType: OSMClimbingElementType
  tags: Record<string, string>
  url: string
}
