import { Alert, Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from 'boulder-ui'

import { AppButton } from '@/shared/ui/app-button/app-button'

interface ExportSessionModalProps {
  canExportCsv: boolean
  canExportSession: boolean
  isCsvExporting: boolean
  isOpen: boolean
  onClose: () => void
  onExportCsv: () => void
  onExportSession: () => void
}

export function ExportSessionModal({
  canExportCsv,
  canExportSession,
  isCsvExporting,
  isOpen,
  onClose,
  onExportCsv,
  onExportSession,
}: ExportSessionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" variant="glass">
      <ModalHeader>
        <ModalTitle>Export session</ModalTitle>
      </ModalHeader>

      <ModalContent>
        <Alert variant="info">
          Choose a tabular export for analysis or a BGSR session export for reproducibility inside the app.
        </Alert>
      </ModalContent>

      <ModalFooter>
        <AppButton
          disabled={!canExportCsv}
          isLoading={isCsvExporting}
          onClick={onExportCsv}
          variant="primary"
        >
          Download CSV
        </AppButton>
        <AppButton
          disabled={!canExportSession}
          onClick={onExportSession}
          variant="secondary"
        >
          Download BGSR session
        </AppButton>
        <AppButton onClick={onClose} variant="secondary">
          Close
        </AppButton>
      </ModalFooter>
    </Modal>
  )
}
