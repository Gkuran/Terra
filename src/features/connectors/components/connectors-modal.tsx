import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
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
  Select,
  Tabs,
} from 'boulder-ui'
import type { FeatureCollection, Geometry } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import { parseCsvToFeatures } from '@/features/connectors/csv/lib/parse-csv-to-features'
import { searchGbifOccurrences } from '@/features/connectors/gbif/lib/search-gbif-occurrences'
import { fetchEnvironmentalLayerCatalog } from '@/features/environmental-layers/api/fetch-environmental-layer-catalog'
import { requestSoilGridsLayer } from '@/features/environmental-layers/api/request-soilgrids-layer'
import type { EnvironmentalLayer } from '@/features/environmental-layers/types/environmental-layer'
import { AppButton } from '@/shared/ui/app-button/app-button'

import './connectors-modal.css'

type ConnectorMode = 'observations' | 'environmental' | 'import'

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
  onAddEnvironmentalLayer: (layer: EnvironmentalLayer) => void
}

export function ConnectorsModal({
  isOpen,
  onClose,
  onImportCsv,
  onOpenShapefileImport,
  onConnectGbif,
  onAddEnvironmentalLayer,
}: ConnectorsModalProps) {
  const [activeTab, setActiveTab] = useState<ConnectorMode>('observations')
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null)
  const [scientificName, setScientificName] = useState('Araucaria angustifolia')
  const [country, setCountry] = useState('BR')
  const [stateProvince, setStateProvince] = useState('Rio Grande do Sul')
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedDepthId, setSelectedDepthId] = useState('')
  const [selectedStatisticId, setSelectedStatisticId] = useState('mean')

  const environmentalCatalogQuery = useQuery({
    enabled: isOpen,
    queryKey: ['environmental-layer-catalog'],
    queryFn: fetchEnvironmentalLayerCatalog,
  })

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
  const environmentalLayerMutation = useMutation({
    mutationFn: requestSoilGridsLayer,
    onSuccess: (layer) => {
      onAddEnvironmentalLayer(layer)
      onClose()
    },
  })

  const availableProperties = environmentalCatalogQuery.data?.properties ?? []
  const selectedProperty = useMemo(
    () =>
      availableProperties.find((property) => property.id === selectedPropertyId) ??
      availableProperties[0] ??
      null,
    [availableProperties, selectedPropertyId],
  )
  const availableDepths = selectedProperty?.depths ?? []
  const availableStatistics = selectedProperty?.statistics ?? []

  useEffect(() => {
    if (!availableProperties.length) {
      return
    }

    setSelectedPropertyId((currentValue) =>
      currentValue && availableProperties.some((property) => property.id === currentValue)
        ? currentValue
        : availableProperties[0].id,
    )
  }, [availableProperties])

  useEffect(() => {
    if (!availableDepths.length) {
      return
    }

    setSelectedDepthId((currentValue) =>
      currentValue && availableDepths.some((depth) => depth.id === currentValue)
        ? currentValue
        : availableDepths[0].id,
    )
  }, [availableDepths])

  useEffect(() => {
    if (!availableStatistics.length) {
      return
    }

    setSelectedStatisticId((currentValue) =>
      currentValue &&
      availableStatistics.some((statistic) => statistic.id === currentValue)
        ? currentValue
        : availableStatistics[0].id,
    )
  }, [availableStatistics])

  function handleClose() {
    setCsvFeedback(null)
    gbifMutation.reset()
    environmentalLayerMutation.reset()
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
            environmentalLayerMutation.reset()
          }}
          value={activeTab}
        >
          <Tabs.List>
            <Tabs.Trigger value="observations">Observations</Tabs.Trigger>
            <Tabs.Trigger value="environmental">Environmental layers</Tabs.Trigger>
            <Tabs.Trigger value="import">Import files</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="observations">
            <div className="connectors-modal__panel">
              <p className="connectors-modal__copy">
                Add fauna and flora observations as discrete records. Use GBIF to bring live occurrences for a target taxon and region without leaving Terra.
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

          <Tabs.Content value="environmental">
            <div className="connectors-modal__panel">
              <p className="connectors-modal__copy">
                Add contextual environmental surfaces without mixing them with fauna and flora records. SoilGrids is rendered as a thematic layer on the same map session.
              </p>
              {environmentalCatalogQuery.isLoading ? (
                <ProgressBar
                  label="Loading environmental layer catalog"
                  max={100}
                  showValue={false}
                  value={72}
                />
              ) : null}
              {environmentalCatalogQuery.error ? (
                <Alert variant="danger">
                  {environmentalCatalogQuery.error.message}
                </Alert>
              ) : null}
              {selectedProperty ? (
                <>
                  <div className="connectors-modal__form">
                    <FormField label="Soil property">
                      <Select
                        onChange={(event) => setSelectedPropertyId(event.target.value)}
                        value={selectedPropertyId}
                      >
                        {availableProperties.map((property) => (
                          <option key={property.id} value={property.id}>
                            {property.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField label="Depth interval">
                      <Select
                        onChange={(event) => setSelectedDepthId(event.target.value)}
                        value={selectedDepthId}
                      >
                        {availableDepths.map((depth) => (
                          <option key={depth.id} value={depth.id}>
                            {depth.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField label="Statistic">
                      <Select
                        onChange={(event) => setSelectedStatisticId(event.target.value)}
                        value={selectedStatisticId}
                      >
                        {availableStatistics.map((statistic) => (
                          <option key={statistic.id} value={statistic.id}>
                            {statistic.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>

                  <Alert variant="info">
                    {selectedProperty.description} Unit: {selectedProperty.unit}.
                  </Alert>
                </>
              ) : null}
              {environmentalLayerMutation.error ? (
                <Alert variant="danger">
                  {environmentalLayerMutation.error.message}
                </Alert>
              ) : null}
            </div>
          </Tabs.Content>

          <Tabs.Content value="import">
            <div className="connectors-modal__panel">
              <p className="connectors-modal__copy">
                Import local files when you already have georeferenced data outside online providers.
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
              <AppButton onClick={onOpenShapefileImport} variant="primary">
                Open shapefile import
              </AppButton>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </ModalContent>

      <ModalFooter>
        {activeTab === 'observations' ? (
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
            Add observations
          </AppButton>
        ) : null}
        {activeTab === 'environmental' ? (
          <AppButton
            disabled={!selectedProperty || !selectedDepthId || !selectedStatisticId}
            isLoading={environmentalLayerMutation.isPending}
            onClick={() => {
              if (!selectedProperty || !selectedDepthId || !selectedStatisticId) {
                return
              }

              environmentalLayerMutation.mutate({
                propertyId: selectedProperty.id,
                depthId: selectedDepthId,
                statisticId: selectedStatisticId,
              })
            }}
            variant="primary"
          >
            Add environmental layer
          </AppButton>
        ) : null}
        <AppButton onClick={handleClose} variant="secondary">
          Close
        </AppButton>
      </ModalFooter>
    </Modal>
  )
}
