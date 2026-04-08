import { Alert, Card, CardContent, ProgressBar } from 'boulder-ui'

import './query-feedback-banner.css'

interface QueryFeedbackBannerProps {
  errorMessage: string | null
  isLoading: boolean
  loadingLabel: string
}

export function QueryFeedbackBanner({
  errorMessage,
  isLoading,
  loadingLabel,
}: QueryFeedbackBannerProps) {
  if (!isLoading && !errorMessage) {
    return null
  }

  return (
    <div className="query-feedback-banner" aria-live="polite">
      <Card className="query-feedback-banner__card" variant="glass">
        <CardContent className="query-feedback-banner__content">
          {isLoading ? (
            <ProgressBar
              label={loadingLabel}
              max={100}
              showValue={false}
              value={72}
              variant="primary"
            />
          ) : null}

          {errorMessage ? (
            <Alert heading="Bounding box search" variant="danger">
              {errorMessage}
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
