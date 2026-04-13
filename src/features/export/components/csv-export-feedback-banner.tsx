import { Card, CardContent, ProgressBar } from 'boulder-ui'

import './csv-export-feedback-banner.css'

interface CsvExportFeedbackBannerProps {
  currentStep: string
  isVisible: boolean
}

export function CsvExportFeedbackBanner({
  currentStep,
  isVisible,
}: CsvExportFeedbackBannerProps) {
  if (!isVisible) {
    return null
  }

  return (
    <div aria-live="polite" className="csv-export-feedback-banner">
      <Card className="csv-export-feedback-banner__card" variant="glass">
        <CardContent className="csv-export-feedback-banner__content">
          <ProgressBar
            label={currentStep}
            max={100}
            showValue={false}
            value={72}
            variant="primary"
          />
        </CardContent>
      </Card>
    </div>
  )
}
