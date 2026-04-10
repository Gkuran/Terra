export interface EnvironmentalLayerLegend {
  url: string
}

export interface EnvironmentalLayer {
  id: string
  type: 'soilgrids'
  provider: 'ISRIC'
  label: string
  description: string
  propertyId: string
  propertyLabel: string
  depthId: string
  depthLabel: string
  statisticId: string
  statisticLabel: string
  unit: string
  attribution: string
  tileUrlTemplate: string
  legend: EnvironmentalLayerLegend
  isVisible: boolean
  opacity: number
}

export interface SoilGridsDepthOption {
  id: string
  label: string
}

export interface SoilGridsPropertyOption {
  id: string
  label: string
  description: string
  unit: string
  depths: SoilGridsDepthOption[]
  statistics: SoilGridsStatisticOption[]
}

export interface SoilGridsStatisticOption {
  id: string
  label: string
  description: string
}

export interface SoilGridsCatalog {
  metadata: {
    source: 'SoilGrids'
    provider: 'ISRIC'
    sourceType: 'environmental-layer'
    description: string
    attribution: string
  }
  properties: SoilGridsPropertyOption[]
}

export interface SoilGridsPointSample {
  propertyId: string
  propertyLabel: string
  depthId: string
  depthLabel: string
  statisticId: string
  statisticLabel: string
  unit: string
  value: number | null
}
