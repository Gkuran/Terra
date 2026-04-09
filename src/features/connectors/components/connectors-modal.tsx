import type { ChangeEvent } from 'react'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Alert,
  FormField,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ProgressBar,
  Tabs,
} from 'boulder-ui'
import type { FeatureCollection, Geometry } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import { parseCsvToFeatures } from '@/features/connectors/csv/lib/parse-csv-to-features'
import { searchGbifOccurrences } from '@/features/connectors/gbif/lib/search-gbif-occurrences'
import { AppButton } from '@/shared/ui/app-button/app-button'

import './connectors-modal.css'

type ConnectorMode = 'csv' | 'gbif' | 'shapefile'

interface ConnectorsModalProps {
  isOpen: boolean
  onClose: () => void
  onImportCsv: (input: {
    collection: FeatureCollection<Geometry, FeatureProperties>
    sourceName: string
  }) => void
  onOpenShapefileImport: () => void
  onConnectGbif: (input: {
    collection: FeatureCollection<Geometry, FeatureProperties>
    sourceName: string
  }) => void
}

export function ConnectorsModal({
  isOpen,
  onClose,
  onImportCsv,
  onOpenShapefileImport,
  onConnectGbif,
}: ConnectorsModalProps) {
  const [activeTab, setActiveTab] = useState<ConnectorMode>('csv')
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null)
  const [scientificName, setScientificName] = useState('Araucaria angustifolia')
  const [country, setCountry] = useState('BR')
  const [stateProvince, setStateProvince] = useState('Rio Grande do Sul')

  const gbifMutation = useMutation({
    mutationFn: searchGbifOccurrences,
    onSuccess: (collection, variables) => {
      onConnectGbif({
        collection,
        sourceName: variables.scientificName.trim() || 'GBIF dataset',
      })
      onClose()
    },
  })

  function handleClose() {
    setCsvFeedback(null)
    gbifMutation.reset()
    onClose()
  }

  function handleGbifFieldChange(setter: (value: string) => void, value: string) {
    if (gbifMutation.error) {
      gbifMutation.reset()
    }
    setter(value)
  }

  async function handleCsvFileChange(event: ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.target.files ?? [])

    if (!file) {
      return
    }

    try {
      const collection = await parseCsvToFeatures(file)
      setCsvFeedback(
        `${collection.features.length} georeferenced records were imported from ${file.name}.`,
      )
      onImportCsv({
        collection,
        sourceName: file.name,
      })
      onClose()
    } catch (error) {
      setCsvFeedback(
        error instanceof Error ? error.message : 'CSV import could not be completed.',
      )
    } finally {
      event.target.value = ''
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" variant="glass">
      <ModalHeader>
        <ModalTitle>Connect data source</ModalTitle>
      </ModalHeader>

      <ModalContent>
        <Tabs.Root
          onValueChange={(value) => {
            setActiveTab(value as ConnectorMode)
            setCsvFeedback(null)
            gbifMutation.reset()
          }}
          value={activeTab}
        >
          <Tabs.List>
            <Tabs.Trigger value="csv">Import CSV</Tabs.Trigger>
            <Tabs.Trigger value="gbif">Connect GBIF</Tabs.Trigger>
            <Tabs.Trigger value="shapefile">Import shapefile</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="csv">
            <div className="connectors-modal__panel">
              <p className="connectors-modal__copy">
                Import a CSV with latitude and longitude columns. Common scientific fields such as `scientificName`, `eventDate`, `basisOfRecord`, and `recordedBy` are preserved in the inspector.
              </p>
              <label className="connectors-modal__dropzone">
                <input
                  accept=".csv,text/csv"
                  className="connectors-modal__file-input"
                  onChange={handleCsvFileChange}
                  type="file"
                />
                <strong>Select a CSV file</strong>
                <span>Expected columns include `latitude`/`longitude` or `decimalLatitude`/`decimalLongitude`.</span>
              </label>
              {csvFeedback ? <Alert variant="info">{csvFeedback}</Alert> : null}
            </div>
          </Tabs.Content>

          <Tabs.Content value="gbif">
            <div className="connectors-modal__panel">
              <p className="connectors-modal__copy">
                Fetch georeferenced occurrences directly from the GBIF public API, without forcing manual downloads and file conversion.
              </p>
              <div className="connectors-modal__form">
                <FormField label="Scientific name">
                  <Input
                    onChange={(event) =>
                      handleGbifFieldChange(setScientificName, event.target.value)
                    }
                    placeholder="Araucaria angustifolia"
                    value={scientificName}
                  />
                </FormField>
                <FormField label="Country code">
                  <Input
                    maxLength={2}
                    onChange={(event) =>
                      handleGbifFieldChange(setCountry, event.target.value.toUpperCase())
                    }
                    placeholder="BR"
                    value={country}
                  />
                </FormField>
                <FormField label="State or province">
                  <Input
                    onChange={(event) =>
                      handleGbifFieldChange(setStateProvince, event.target.value)
                    }
                    placeholder="Rio Grande do Sul"
                    value={stateProvince}
                  />
                </FormField>
              </div>
              {gbifMutation.isPending ? (
                <ProgressBar label="Querying GBIF" max={100} showValue value={72} />
              ) : null}
              {gbifMutation.error ? (
                <Alert variant="danger">{gbifMutation.error.message}</Alert>
              ) : null}
            </div>
          </Tabs.Content>

          <Tabs.Content value="shapefile">
            <div className="connectors-modal__panel">
              <p className="connectors-modal__copy">
                Legacy geospatial import for zipped shapefiles. This remains available, but CSV and live connectors are the preferred path for scientific records.
              </p>
              <AppButton onClick={onOpenShapefileImport} variant="primary">
                Open shapefile import
              </AppButton>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </ModalContent>

      <ModalFooter>
        {activeTab === 'gbif' ? (
          <AppButton
            isLoading={gbifMutation.isPending}
            onClick={() =>
              gbifMutation.mutate({
                scientificName,
                country,
                stateProvince,
              })
            }
            variant="primary"
          >
            Connect GBIF
          </AppButton>
        ) : null}
        <AppButton onClick={handleClose} variant="secondary">
          Close
        </AppButton>
      </ModalFooter>
    </Modal>
  )
}
