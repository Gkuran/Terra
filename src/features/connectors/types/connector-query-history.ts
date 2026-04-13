import type {
  ConnectorContext,
  ConnectorDatasetProvenance,
  ConnectorSourceType,
} from '@/features/connectors/types/connector-dataset'

export interface ConnectorQueryHistoryEntry {
  id: string
  context: ConnectorContext
  recordedAt: string
  sourceType: ConnectorSourceType
  label: string
  provenance: ConnectorDatasetProvenance
}
