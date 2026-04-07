export interface UploadResult {
  id: string
  sourceName: string
  featureCount: number
  importedAt: string
  status: 'success' | 'error'
  message: string
}
