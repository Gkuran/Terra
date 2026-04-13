import { DataAttribute } from 'boulder-ui'

import type { DatasetMetadata } from '@/entities/dataset/model/dataset'
import type { ConnectorDatasetProvenance } from '@/features/connectors/types/connector-dataset'

interface InspectorProvenanceSectionProps {
  baseDataset: DatasetMetadata
  connectorProvenance?: ConnectorDatasetProvenance | null
}

function formatImportedAt(value: string) {
  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not provided'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

export function InspectorProvenanceSection({
  baseDataset,
  connectorProvenance = null,
}: InspectorProvenanceSectionProps) {
  return (
    <div className="feature-inspector-panel__attributes">
      <h4 className="feature-inspector-panel__attributes-title">Provenance</h4>
      <div className="feature-inspector-panel__grid">
        <DataAttribute
          label="Provider"
          orientation="vertical"
          value={connectorProvenance?.provider ?? 'Terra base dataset'}
        />
        <DataAttribute
          label="Source name"
          orientation="vertical"
          value={connectorProvenance?.sourceName ?? baseDataset.name}
        />
        <DataAttribute
          label="Imported at"
          orientation="vertical"
          value={
            connectorProvenance
              ? formatImportedAt(connectorProvenance.importedAt)
              : formatImportedAt(baseDataset.updatedAt)
          }
        />
      </div>
    </div>
  )
}
