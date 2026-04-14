import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'
import {
  Alert,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ProgressBar,
} from 'boulder-ui'
import type { FeatureCollection, Geometry } from 'geojson'

import type { FeatureProperties } from '@/entities/geographic-feature/model/geographic-feature'
import { getFeatureCollectionBounds } from '@/features/map/lib/get-feature-collection-bounds'
import { createUploadResult } from '@/features/shapefile-upload/lib/create-upload-result'
import { normalizeUploadedFeatures } from '@/features/shapefile-upload/lib/normalize-uploaded-features'
import { parseShapefileArchive } from '@/features/shapefile-upload/lib/parse-shapefile'
import type { UploadResult } from '@/features/shapefile-upload/types/upload-result'
import { AppButton } from '@/shared/ui/app-button/app-button'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import './upload-shapefile-modal.css'

interface UploadShapefileModalProps {
  isOpen: boolean
  lastUploadResult: UploadResult | null
  uploadHistory: UploadResult[]
  onClose: () => void
  onUploadComplete: (
    collections: Array<{
      collection: FeatureCollection<Geometry, FeatureProperties>
      sourceName: string
    }>,
    result: UploadResult,
  ) => void
}

function isWebMapBounds(bounds: [[number, number], [number, number]]) {
  const [[minLongitude, minLatitude], [maxLongitude, maxLatitude]] = bounds

  return (
    minLongitude >= -180 &&
    maxLongitude <= 180 &&
    minLatitude >= -90 &&
    maxLatitude <= 90
  )
}

function buildLayerSourceName(
  archiveFileName: string,
  layerFileName: string | null,
  index: number,
) {
  if (!layerFileName) {
    return `${archiveFileName} - Layer ${index + 1}`
  }

  const normalizedSegments = layerFileName.replace(/\\/g, '/').split('/')
  const lastSegment = normalizedSegments.at(-1) ?? layerFileName

  return lastSegment.trim() !== '' ? lastSegment : `${archiveFileName} - Layer ${index + 1}`
}

export function UploadShapefileModal({
  isOpen,
  lastUploadResult,
  uploadHistory,
  onClose,
  onUploadComplete,
}: UploadShapefileModalProps) {
  const [feedback, setFeedback] = useState<UploadResult | null>(lastUploadResult)
  const [isUploading, setIsUploading] = useState(false)
  const history = useMemo(
    () => (feedback ? [feedback, ...uploadHistory] : uploadHistory),
    [feedback, uploadHistory],
  )

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.target.files ?? [])

    if (!file) {
      return
    }

    setIsUploading(true)

    try {
      const parsedLayers = await parseShapefileArchive(await file.arrayBuffer())
      const normalizedLayers = parsedLayers.map((layer, index) => {
        const sourceName = buildLayerSourceName(file.name, layer.fileName, index)
        const normalizedCollection = normalizeUploadedFeatures(layer.collection, sourceName)
        const bounds = getFeatureCollectionBounds(normalizedCollection)

        if (!bounds) {
          throw new Error(
            `The shapefile layer "${sourceName}" does not contain valid geometry bounds for map display.`,
          )
        }

        if (!isWebMapBounds(bounds)) {
          throw new Error(
            `The shapefile layer "${sourceName}" appears to use projected coordinates or an unsupported CRS. Reproject the dataset to EPSG:4326 (WGS84 longitude/latitude) and include the .prj file before importing.`,
          )
        }

        return {
          collection: normalizedCollection,
          sourceName,
        }
      })
      const totalFeatureCount = normalizedLayers.reduce(
        (count, layer) => count + layer.collection.features.length,
        0,
      )
      const result = createUploadResult({
        featureCount: totalFeatureCount,
        idPrefix: 'upload',
        message:
          normalizedLayers.length > 1
            ? `Archive parsed locally into ${normalizedLayers.length} layers and ready for overlay review.`
            : 'Archive parsed locally and ready for overlay review.',
        sourceName: file.name,
        status: 'success',
      })

      setFeedback(result)
      onUploadComplete(normalizedLayers, result)
    } catch (error) {
      setFeedback(
        createUploadResult({
          featureCount: 0,
          idPrefix: 'upload',
          message:
            error instanceof Error
              ? error.message
              : 'The selected archive could not be processed.',
          sourceName: file.name,
          status: 'error',
        }),
      )
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" variant="glass">
      <ModalHeader>
        <ModalTitle>Import shapefile</ModalTitle>
      </ModalHeader>

      <ModalContent>
        <div className="upload-shapefile-modal">
          <p className="upload-shapefile-modal__intro">
            Upload a zipped shapefile archive to convert it to GeoJSON locally and preview it on the map.
          </p>

          <label className="upload-shapefile-modal__dropzone">
            <input
              accept=".zip"
              className="upload-shapefile-modal__input"
              disabled={isUploading}
              onChange={handleFileChange}
              type="file"
            />
            <strong>
              {isUploading ? 'Parsing archive...' : 'Choose a zipped shapefile'}
            </strong>
            <span>Current support expects a `.zip` archive.</span>
          </label>

          {isUploading ? (
            <ProgressBar
              label="Local ingestion"
              max={100}
              showValue
              value={65}
              variant="primary"
            />
          ) : null}

          {feedback ? (
            <Alert
              heading={feedback.sourceName}
              variant={feedback.status === 'success' ? 'success' : 'danger'}
            >
              <div className="upload-shapefile-modal__feedback">
                <StatusBadge
                  label={feedback.status}
                  tone={feedback.status === 'success' ? 'ready' : 'critical'}
                />
                <p>{feedback.message}</p>
              </div>
            </Alert>
          ) : null}

          <div className="upload-shapefile-modal__history">
            <span className="upload-shapefile-modal__history-label">Recent uploads</span>
            {history.length === 0 ? (
              <p className="upload-shapefile-modal__empty">
                No uploaded datasets were recorded yet.
              </p>
            ) : (
              <ul className="upload-shapefile-modal__history-list">
                {history.slice(0, 3).map((entry) => (
                  <li className="upload-shapefile-modal__history-item" key={entry.id}>
                    <div>
                      <strong>{entry.sourceName}</strong>
                      <p>{entry.message}</p>
                    </div>
                    <span>{entry.featureCount} features</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </ModalContent>

      <ModalFooter>
        <AppButton onClick={onClose} variant="secondary">
          Close
        </AppButton>
      </ModalFooter>
    </Modal>
  )
}
