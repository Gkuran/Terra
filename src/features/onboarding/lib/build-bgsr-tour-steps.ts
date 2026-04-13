import type { OnboardingStep } from '@/features/onboarding/types/onboarding-step'

interface BuildBgsrTourStepsInput {
  hasConnectorLayers: boolean
  hasInspector: boolean
  hasQueryResults: boolean
}

export function buildBgsrTourSteps({
  hasConnectorLayers,
  hasInspector,
  hasQueryResults,
}: BuildBgsrTourStepsInput): OnboardingStep[] {
  return [
    {
      id: 'header-brand',
      target: '[data-tour="header-brand"]',
      title: 'BGSR workspace',
      description:
        'This is the main scientific workspace. Most session-level actions start from the header.',
    },
    {
      id: 'sources-button',
      target: '[data-tour="header-sources"]',
      title: 'Connect data',
      description:
        'Use Sources to load GBIF observations, CSV files, shapefiles, environmental layers, or a BGSR session export.',
    },
    {
      id: 'connectors-modal',
      action: 'open-connectors',
      target: '[data-tour="connectors-modal"]',
      title: 'Import and connectors',
      description:
        'This modal centralizes live data connectors and local imports. Session restoration also happens here.',
    },
    {
      id: 'settings-button',
      target: '[data-tour="header-settings"]',
      title: 'Area query settings',
      description:
        'Settings define which sources are used when you draw a bounding box query on the map.',
    },
    {
      id: 'settings-modal',
      action: 'open-settings',
      target: '[data-tour="query-settings-modal"]',
      title: 'Query sources',
      description:
        'Choose whether bounding box searches should load GBIF observations, Macrostrat geology, or both.',
    },
    {
      id: 'map-toolbar',
      target: '[data-tour="map-toolbar"]',
      title: 'Map tools',
      description:
        'Switch between inspect, pan, and bounding-box query modes. The layers button opens the environmental layers panel.',
    },
    {
      id: 'layers-panel',
      action: 'open-layers',
      target: '[data-tour="environmental-layers-panel"]',
      title: 'Environmental layers',
      description:
        'Manage active SoilGrids layers, visibility, and opacity without mixing them with biological occurrences.',
    },
    ...(hasConnectorLayers
      ? [
          {
            id: 'observation-layers',
            target: '[data-tour="connector-legend-panel"]',
            title: 'Observation layers',
            description:
              'Imported occurrence datasets are listed here. You can toggle visibility, zoom to a dataset, or remove it.',
          } satisfies OnboardingStep,
        ]
      : []),
    ...(hasQueryResults
      ? [
          {
            id: 'query-results',
            target: '[data-tour="query-results-panel"]',
            title: 'Area query results',
            description:
              'This panel summarizes GBIF records loaded for the current area and lets you refine them with local filters.',
          } satisfies OnboardingStep,
        ]
      : []),
    ...(hasInspector
      ? [
          {
            id: 'inspector',
            target: '[data-tour="feature-inspector-panel"]',
            title: 'Feature inspector',
            description:
              'When you select a record or layer feature, the inspector shows attributes, provenance, media, and navigation controls.',
          } satisfies OnboardingStep,
        ]
      : []),
    {
      id: 'export-button',
      target: '[data-tour="header-export"]',
      title: 'Export session',
      description:
        'Export creates analysis-ready CSV files or full BGSR session files that other users can import and reproduce.',
    },
  ]
}
