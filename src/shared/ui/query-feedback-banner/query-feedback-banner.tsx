import { Alert, Card, CardContent, ProgressBar } from 'boulder-ui'
import { IoClose } from 'react-icons/io5'

import './query-feedback-banner.css'

interface QueryFeedbackBannerProps {
  errorMessage: string | null
  heading?: string
  helpLabel?: string | null
  helpUrl?: string | null
  isLoading: boolean
  loadingLabel: string
  onDismissError: () => void
}

export function QueryFeedbackBanner({
  errorMessage,
  heading = 'Area query',
  helpLabel = null,
  helpUrl = null,
  isLoading,
  loadingLabel,
  onDismissError,
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
            <div className="query-feedback-banner__error">
              <Alert heading={heading} variant="danger">
                {errorMessage}
              </Alert>
              {helpUrl && helpLabel ? (
                <a
                  className="query-feedback-banner__help-link"
                  href={helpUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {helpLabel}
                </a>
              ) : null}
              <button
                aria-label="Dismiss area query error"
                className="query-feedback-banner__dismiss"
                onClick={onDismissError}
                type="button"
              >
                <IoClose aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
