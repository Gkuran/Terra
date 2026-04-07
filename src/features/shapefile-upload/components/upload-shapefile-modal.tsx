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
    collection: FeatureCollection<Geometry, FeatureProperties>,
    result: UploadResult,
  ) => void
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
      const collection = await parseShapefileArchive(await file.arrayBuffer())
      const normalizedCollection = normalizeUploadedFeatures(collection, file.name)
      const result: UploadResult = {
        id: `upload-${Date.now()}`,
        sourceName: file.name,
        featureCount: normalizedCollection.features.length,
        importedAt: new Date().toISOString(),
        status: 'success',
        message: 'Archive parsed locally and ready for overlay review.',
      }

      setFeedback(result)
      onUploadComplete(normalizedCollection, result)
    } catch (error) {
      setFeedback({
        id: `upload-${Date.now()}`,
        sourceName: file.name,
        featureCount: 0,
        importedAt: new Date().toISOString(),
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'The selected archive could not be processed.',
      })
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
