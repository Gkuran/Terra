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
      target: '[data-tour="header-actions"]',
      title: 'BGSR workspace',
      description:
        'These header actions control the main session workflow: loading sources, configuring area queries, exporting outputs, and reopening the guide.',
    },
    {
      id: 'sources-button',
      target: '[data-tour="header-sources"]',
      title: 'Connect data',
      description:
        'Use Sources to load GBIF observations, CSV files, shapefiles, environmental layers, or a BGSR session export.',
    },
    {
      id: 'connectors-add-observations',
      action: 'open-connectors',
      placement: 'modal-side',
      target: '[data-tour="connectors-add-observations"]',
      title: 'Load the example data',
      description:
        'The query form is already prefilled with Araucaria angustifolia in southern Brazil. Click Add observations to fetch the example records and continue the tour.',
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
      placement: 'modal-side',
      target: '[data-tour="query-settings-panel"]',
      title: 'Query sources',
      description:
        'Choose whether bounding box searches should load GBIF observations, Macrostrat geology, or both.',
    },
    {
      allowBackgroundInteraction: true,
      id: 'bbox-tool-demo',
      target: '[data-tour="map-toolbar-bbox"]',
      title: 'Run an area query',
      description:
        'Use the bbox tool to drag a rectangle on the map and query the visible sources inside that area.',
      imageAlt: 'Animated example of the bbox tool drawing a rectangle on the map.',
      imageUrl: '/onboardgif.gif',
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
            allowBackgroundInteraction: true,
            id: 'query-results',
            placement: 'side-left',
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
    {
      id: 'tour-button',
      target: '[data-tour="header-tour"]',
      title: 'Replay the guide',
      description:
        'Use Tour at any time to reopen this guided walkthrough and revisit the main BGSR actions.',
    },
  ]
}
