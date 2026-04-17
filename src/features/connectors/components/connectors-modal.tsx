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
import {
  GBIF_SYSTEM_HEALTH_URL,
  getGbifHelpLinkForMessage,
} from '@/features/connectors/gbif/lib/build-gbif-error-feedback'
import { searchGbifOccurrences } from '@/features/connectors/gbif/lib/search-gbif-occurrences'
import type { ConnectorDataset } from '@/features/connectors/types/connector-dataset'
import type { BgsrSessionImport } from '@/features/export/lib/bgsr-session-schema'
import { readBgsrSessionFile } from '@/features/export/lib/read-bgsr-session-file'
import { useConnectorDatasetsStore } from '@/features/connectors/stores/use-connector-datasets-store'
import { fetchEnvironmentalLayerCatalog } from '@/features/environmental-layers/api/fetch-environmental-layer-catalog'
import { requestSoilGridsLayer } from '@/features/environmental-layers/api/request-soilgrids-layer'
import { OnboardingInlineStep } from '@/features/onboarding/components/onboarding-inline-step'
import type { OnboardingStep } from '@/features/onboarding/types/onboarding-step'
import type { EnvironmentalLayer } from '@/features/environmental-layers/types/environmental-layer'
import { AppButton } from '@/shared/ui/app-button/app-button'
import { useToastStore } from '@/shared/ui/app-toast'

import './connectors-modal.css'

type ConnectorMode = 'observations' | 'environmental' | 'import'

interface ConnectorsModalProps {
  onboardingStep?: OnboardingStep | null
  onboardingStepDisabledHint?: string | null
  onboardingStepIndex?: number
  onboardingStepsCount?: number
  onOnboardingClose?: () => void
  onOnboardingNext?: () => void
  onOnboardingPrevious?: () => void
  isOnboardingNextDisabled?: boolean
  hasActiveSession: boolean
  isOpen: boolean
  onClose: () => void
  onImportCsv: (input: {
    collection: FeatureCollection<Geometry, FeatureProperties>
    provenance?: Partial<ConnectorDataset['provenance']>
    sourceName: string
  }) => void
  onImportSession: (input: {
    fileName: string
    mode: 'merge' | 'replace'
    session: BgsrSessionImport
    warnings: string[]
  }) => void
  onOpenShapefileImport: () => void
  onConnectGbif: (input: {
    collection: FeatureCollection<Geometry, FeatureProperties>
    provenance?: Partial<ConnectorDataset['provenance']>
    sourceName: string
  }) => void
  onAddEnvironmentalLayer: (layer: EnvironmentalLayer) => void
}

export function ConnectorsModal({
  onboardingStep = null,
  onboardingStepDisabledHint = null,
  onboardingStepIndex = 0,
  onboardingStepsCount = 1,
  onOnboardingClose,
  onOnboardingNext,
  onOnboardingPrevious,
  isOnboardingNextDisabled = false,
  hasActiveSession,
  isOpen,
  onClose,
  onImportCsv,
  onImportSession,
  onOpenShapefileImport,
  onConnectGbif,
  onAddEnvironmentalLayer,
}: ConnectorsModalProps) {
  const recentQueries = useConnectorDatasetsStore((state) => state.recentQueries)
  const pushToast = useToastStore((state) => state.pushToast)
  const [activeTab, setActiveTab] = useState<ConnectorMode>('observations')
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null)
  const [pendingSessionFileName, setPendingSessionFileName] = useState<string | null>(null)
  const [pendingSessionImport, setPendingSessionImport] = useState<BgsrSessionImport | null>(null)
  const [pendingSessionWarnings, setPendingSessionWarnings] = useState<string[]>([])
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
      const normalizedScientificName = variables.scientificName.trim()
      const normalizedCountry = variables.country.trim().toUpperCase()
      const normalizedStateProvince = variables.stateProvince?.trim() ?? ''

      onConnectGbif({
        collection,
        provenance: {
          provider: 'GBIF',
          sourceName: normalizedScientificName || 'GBIF dataset',
          queryLabel: [normalizedScientificName, normalizedStateProvince, normalizedCountry]
            .filter((value) => value !== '')
            .join(' / '),
          queryParams: {
            scientificName: normalizedScientificName,
            country: normalizedCountry,
            ...(normalizedStateProvince ? { stateProvince: normalizedStateProvince } : {}),
            limit: '200',
          },
          notes: ['Imported from the manual GBIF observations connector.'],
        },
        sourceName: normalizedScientificName || 'GBIF dataset',
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
  const recentObservationQueries = useMemo(
    () =>
      recentQueries.filter(
        (entry) => entry.sourceType === 'gbif' && entry.context === 'manual',
      ),
    [recentQueries],
  )
  const recentImportQueries = useMemo(
    () =>
      recentQueries.filter(
        (entry) =>
          entry.sourceType === 'csv' || entry.sourceType === 'shapefile',
      ),
    [recentQueries],
  )
  const gbifErrorHelpLink = gbifMutation.error
    ? getGbifHelpLinkForMessage(gbifMutation.error.message)
    : null

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
    setPendingSessionFileName(null)
    setPendingSessionImport(null)
    setPendingSessionWarnings([])
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
      pushToast({
        description: `${collection.features.length} georeferenced records are ready to be added.`,
        title: 'CSV parsed',
        variant: 'info',
      })
      onImportCsv({
        collection,
        provenance: {
          provider: 'CSV',
          sourceName: file.name,
          queryParams: {
            fileName: file.name,
          },
          notes: ['Imported from a local CSV file.'],
        },
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

  async function handleSessionFileChange(event: ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.target.files ?? [])

    if (!file) {
      return
    }

    try {
      const result = await readBgsrSessionFile(file)
      setCsvFeedback(null)
      setPendingSessionFileName(file.name)
      setPendingSessionImport(result.session)
      setPendingSessionWarnings(result.warnings)
      pushToast({
        description:
          'Choose whether the imported BGSR session should replace or merge with the current workspace.',
        title: 'Session file ready',
        variant: 'info',
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'BGSR session import could not be completed.'
      setCsvFeedback(
        errorMessage,
      )
      pushToast({
        description: errorMessage,
        title: 'Session import failed',
        variant: 'danger',
      })
    } finally {
      event.target.value = ''
    }
  }

  function formatRecordedAt(value: string) {
    const parsedDate = new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Unknown date'
    }

    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(parsedDate)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" variant="glass">
      <ModalHeader>
        <ModalTitle>Connect data source</ModalTitle>
      </ModalHeader>

      <ModalContent>
        <div data-tour="connectors-modal">
        {onboardingStep ? (
          <OnboardingInlineStep
            currentStep={onboardingStep}
            currentStepIndex={onboardingStepIndex}
            disabledNextHint={onboardingStepDisabledHint}
            isNextDisabled={isOnboardingNextDisabled}
            onClose={onOnboardingClose ?? handleClose}
            onNext={onOnboardingNext ?? handleClose}
            onPrevious={onOnboardingPrevious ?? handleClose}
            stepsCount={onboardingStepsCount}
          />
        ) : null}
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
              <Alert variant="info">
                GBIF queries depend on external service availability. Empty or failed responses may come from the source itself.{' '}
                <a
                  className="connectors-modal__inline-link"
                  href={GBIF_SYSTEM_HEALTH_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  Check GBIF system health
                </a>
                .
              </Alert>
              <div className="connectors-modal__form" data-tour="connectors-observations-form">
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
                <Alert variant="danger">
                  {gbifMutation.error.message}
                  {gbifErrorHelpLink ? (
                    <>
                      {' '}
                      <a
                        className="connectors-modal__inline-link"
                        href={gbifErrorHelpLink.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {gbifErrorHelpLink.label}
                      </a>
                      .
                    </>
                  ) : null}
                </Alert>
              ) : null}
              <div className="connectors-modal__history">
                <div className="connectors-modal__history-header">
                  <strong>Recent observation queries</strong>
                  <span>{recentObservationQueries.length} stored in this session</span>
                </div>
                {recentObservationQueries.length === 0 ? (
                  <p className="connectors-modal__history-empty">
                    No manual GBIF queries were recorded yet.
                  </p>
                ) : (
                  <ul className="connectors-modal__history-list">
                    {recentObservationQueries.slice(0, 4).map((entry) => (
                      <li className="connectors-modal__history-item" key={entry.id}>
                        <div className="connectors-modal__history-copy">
                          <strong>{entry.provenance.queryLabel ?? entry.label}</strong>
                          <span>
                            {entry.provenance.recordCount} records •{' '}
                            {formatRecordedAt(entry.recordedAt)}
                          </span>
                        </div>
                        <AppButton
                          onClick={() => {
                            setScientificName(
                              entry.provenance.queryParams.scientificName ?? '',
                            )
                            setCountry(entry.provenance.queryParams.country ?? '')
                            setStateProvince(
                              entry.provenance.queryParams.stateProvince ?? '',
                            )
                            gbifMutation.reset()
                          }}
                          variant="secondary"
                        >
                          Use again
                        </AppButton>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
              <label className="connectors-modal__dropzone">
                <input
                  accept=".bgsr.json,.json,application/json"
                  className="connectors-modal__file-input"
                  onChange={handleSessionFileChange}
                  type="file"
                />
                <strong>Select a BGSR session file</strong>
                <span>Use a `.bgsr.json` export to restore datasets, filters, layers, and core map state.</span>
              </label>
              {pendingSessionImport && pendingSessionFileName ? (
                <Alert variant="info">
                  Ready to import <strong>{pendingSessionFileName}</strong> with{' '}
                  {pendingSessionImport.sessionData.connectorDatasets.length} connector datasets and{' '}
                  {pendingSessionImport.layers.environmental.length} environmental layers.
                </Alert>
              ) : null}
              {pendingSessionWarnings.length > 0 ? (
                <Alert variant="warning">
                  {pendingSessionWarnings.join(' ')}
                </Alert>
              ) : null}
              {csvFeedback ? <Alert variant="info">{csvFeedback}</Alert> : null}
              {pendingSessionImport && pendingSessionFileName ? (
                <div className="connectors-modal__session-actions">
                  <AppButton
                    onClick={() => {
                      onImportSession({
                        fileName: pendingSessionFileName,
                        mode: 'replace',
                        session: pendingSessionImport,
                        warnings: pendingSessionWarnings,
                      })
                      onClose()
                    }}
                    variant="primary"
                  >
                    Replace session
                  </AppButton>
                  <AppButton
                    disabled={!hasActiveSession}
                    onClick={() => {
                      onImportSession({
                        fileName: pendingSessionFileName,
                        mode: 'merge',
                        session: pendingSessionImport,
                        warnings: pendingSessionWarnings,
                      })
                      onClose()
                    }}
                    variant="secondary"
                  >
                    Merge session
                  </AppButton>
                </div>
              ) : null}
              <AppButton onClick={onOpenShapefileImport} variant="primary">
                Open shapefile import
              </AppButton>
              <div className="connectors-modal__history">
                <div className="connectors-modal__history-header">
                  <strong>Recent file imports</strong>
                  <span>{recentImportQueries.length} stored in this session</span>
                </div>
                {recentImportQueries.length === 0 ? (
                  <p className="connectors-modal__history-empty">
                    No local imports were recorded yet.
                  </p>
                ) : (
                  <ul className="connectors-modal__history-list">
                    {recentImportQueries.slice(0, 4).map((entry) => (
                      <li className="connectors-modal__history-item" key={entry.id}>
                        <div className="connectors-modal__history-copy">
                          <strong>{entry.provenance.sourceName}</strong>
                          <span>
                            {entry.sourceType.toUpperCase()} •{' '}
                            {entry.provenance.recordCount} records •{' '}
                            {formatRecordedAt(entry.recordedAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
        </div>
      </ModalContent>

      <ModalFooter>
        {activeTab === 'observations' ? (
          <AppButton
            data-tour="connectors-add-observations"
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
