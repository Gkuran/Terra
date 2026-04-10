import type { UploadResult } from '@/features/shapefile-upload/types/upload-result'

interface CreateUploadResultInput {
  featureCount: number
  idPrefix: string
  message: string
  sourceName: string
  status: UploadResult['status']
}

export function createUploadResult({
  featureCount,
  idPrefix,
  message,
  sourceName,
  status,
}: CreateUploadResultInput): UploadResult {
  return {
    id: `${idPrefix}-${Date.now()}`,
    sourceName,
    featureCount,
    importedAt: new Date().toISOString(),
    status,
    message,
  }
}
