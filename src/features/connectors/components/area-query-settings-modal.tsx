import { Modal, ModalContent, ModalHeader, ModalTitle } from 'boulder-ui'

import { AreaQuerySourcesPanel } from '@/features/connectors/components/area-query-sources-panel'

interface AreaQuerySettingsModalProps {
  includeGbif: boolean
  includeMacrostrat: boolean
  isOpen: boolean
  onClose: () => void
  onToggleGbif: () => void
  onToggleMacrostrat: () => void
}

export function AreaQuerySettingsModal({
  includeGbif,
  includeMacrostrat,
  isOpen,
  onClose,
  onToggleGbif,
  onToggleMacrostrat,
}: AreaQuerySettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" variant="glass">
      <ModalHeader>
        <ModalTitle>Query settings</ModalTitle>
      </ModalHeader>

      <ModalContent>
        <AreaQuerySourcesPanel
          includeGbif={includeGbif}
          includeMacrostrat={includeMacrostrat}
          onToggleGbif={onToggleGbif}
          onToggleMacrostrat={onToggleMacrostrat}
        />
      </ModalContent>
    </Modal>
  )
}
