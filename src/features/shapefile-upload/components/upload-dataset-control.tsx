import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ProgressBar,
} from 'boulder-ui'
import type { FeatureCollection } from 'geojson'

import { parseShapefileArchive } from '@/features/shapefile-upload/lib/parse-shapefile'
import type { UploadResult } from '@/features/shapefile-upload/types/upload-result'
import { AppButton } from '@/shared/ui/app-button/app-button'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import './upload-dataset-control.css'

interface UploadDatasetControlProps {
  lastUploadResult: UploadResult | null
  uploadHistory: UploadResult[]
  onUploadComplete: (
    collection: FeatureCollection,
    result: UploadResult,
  ) => void
}

export function UploadDatasetControl({
  lastUploadResult,
  uploadHistory,
  onUploadComplete,
}: UploadDatasetControlProps) {
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
      const result: UploadResult = {
        id: `upload-${Date.now()}`,
        sourceName: file.name,
        featureCount: collection.features.length,
        importedAt: new Date().toISOString(),
        status: 'success',
        message: 'Archive parsed locally and ready for overlay review.',
      }

      setFeedback(result)
      onUploadComplete(collection, result)
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
    <Card className="upload-dataset-control" variant="outlined">
      <CardHeader>
        <CardTitle as="h3">Dataset upload</CardTitle>
        <CardDescription>
          Ingest zipped shapefiles locally before the backend pipeline is available.
        </CardDescription>
      </CardHeader>

      <CardContent className="upload-dataset-control__content">
        <label className="upload-dataset-control__dropzone">
          <input
            accept=".zip"
            className="upload-dataset-control__input"
            disabled={isUploading}
            onChange={handleFileChange}
            type="file"
          />
          <strong>
            {isUploading ? 'Parsing archive...' : 'Select a zipped shapefile'}
          </strong>
          <span>
            Expected input is a `.zip` archive that can be converted to GeoJSON on the
            client.
          </span>
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
            <div className="upload-dataset-control__feedback">
              <StatusBadge
                label={feedback.status}
                tone={feedback.status === 'success' ? 'ready' : 'critical'}
              />
              <p>{feedback.message}</p>
            </div>
          </Alert>
        ) : null}

        <div className="upload-dataset-control__history">
          <div className="upload-dataset-control__history-header">
            <span>Recent uploads</span>
            <AppButton disabled variant="ghost">
              Backend sync later
            </AppButton>
          </div>

          {history.length === 0 ? (
            <p className="upload-dataset-control__empty">
              No uploaded datasets were recorded yet.
            </p>
          ) : (
            <ul className="upload-dataset-control__history-list">
              {history.slice(0, 3).map((entry) => (
                <li className="upload-dataset-control__history-item" key={entry.id}>
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
      </CardContent>
    </Card>
  )
}
