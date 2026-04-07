import { create } from 'zustand'

import { createConnectorDataset } from '@/features/connectors/lib/create-connector-dataset'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'

interface AddConnectorDatasetInput {
  collection: ConnectorDataset['collection']
  label: string
  sourceType: ConnectorDataset['sourceType']
}

interface ConnectorDatasetsState {
  datasets: ConnectorDataset[]
  addDataset: (input: AddConnectorDatasetInput) => void
  clearDatasets: () => void
}

export const useConnectorDatasetsStore = create<ConnectorDatasetsState>((set) => ({
  datasets: [],
  addDataset: (input) =>
    set((state) => ({
      datasets: [
        ...state.datasets,
        createConnectorDataset({
          ...input,
          order: state.datasets.length,
        }),
      ],
    })),
  clearDatasets: () => set({ datasets: [] }),
}))
