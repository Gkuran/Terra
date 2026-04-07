export type DatasetStatus = 'ready' | 'processing' | 'draft'

export interface DatasetMetadata {
  id: string
  name: string
  description?: string
  category: 'flora' | 'fauna' | 'biome' | 'soil'
  regionLabel: string
  featureCount: number
  updatedAt: string
  status: DatasetStatus
  tags: string[]
}

export type Dataset = DatasetMetadata
