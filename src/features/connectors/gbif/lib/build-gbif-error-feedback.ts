export const GBIF_SYSTEM_HEALTH_URL = 'https://www.gbif.org/system-health'

interface BuildGbifErrorFeedbackOptions {
  cause?: unknown
  detail?: string | null
  operation: 'area-query' | 'occurrence-detail' | 'observation-search'
  status?: number
}

export interface GbifErrorFeedback {
  helpLink: {
    href: string
    label: string
  } | null
  message: string
}

const upstreamStatusCodes = new Set([429, 500, 502, 503, 504, 520, 522, 524])

function getOperationLabel(operation: BuildGbifErrorFeedbackOptions['operation']) {
  switch (operation) {
    case 'area-query':
      return 'GBIF area query'
    case 'occurrence-detail':
      return 'GBIF occurrence detail'
    case 'observation-search':
      return 'GBIF observation search'
  }
}

function buildHelpLink() {
  return {
    href: GBIF_SYSTEM_HEALTH_URL,
    label: 'Check GBIF system health',
  }
}

export function buildGbifErrorFeedback({
  cause,
  detail,
  operation,
  status,
}: BuildGbifErrorFeedbackOptions): GbifErrorFeedback {
  const normalizedDetail = detail?.trim() ?? ''
  const normalizedDetailLower = normalizedDetail.toLowerCase()
  const operationLabel = getOperationLabel(operation)

  if (normalizedDetailLower.includes('no georeferenced')) {
    return {
      helpLink: null,
      message: normalizedDetail,
    }
  }

  if (status === 404 && operation === 'occurrence-detail') {
    return {
      helpLink: null,
      message: 'GBIF occurrence detail is unavailable for this record or may no longer exist.',
    }
  }

  if (status === 404 || status === 405) {
    return {
      helpLink: null,
      message: `${operationLabel} is unavailable from the configured BGSR API. Start the backend or verify the API deployment.`,
    }
  }

  if (
    upstreamStatusCodes.has(status ?? 0) ||
    normalizedDetailLower.includes('temporarily unavailable') ||
    normalizedDetailLower.includes('service unavailable') ||
    normalizedDetailLower.includes('bad gateway') ||
    normalizedDetailLower.includes('gateway timeout') ||
    normalizedDetailLower.includes('upstream') ||
    normalizedDetailLower.includes('timeout')
  ) {
    return {
      helpLink: buildHelpLink(),
      message: `${operationLabel} is temporarily unavailable. BGSR could not retrieve data from GBIF right now.`,
    }
  }

  if (cause instanceof TypeError) {
    return {
      helpLink: null,
      message: `${operationLabel} could not reach the BGSR API. Check the backend connection and try again.`,
    }
  }

  if (normalizedDetail !== '') {
    return {
      helpLink: null,
      message: normalizedDetail.startsWith('GBIF') ? normalizedDetail : `${operationLabel} failed. ${normalizedDetail}`,
    }
  }

  return {
    helpLink: null,
    message: `${operationLabel} failed. Adjust the filters and try again.`,
  }
}

export function getGbifHelpLinkForMessage(message: string) {
  const normalizedMessage = message.trim().toLowerCase()

  if (
    normalizedMessage.includes('gbif') &&
    normalizedMessage.includes('temporarily unavailable')
  ) {
    return buildHelpLink()
  }

  return null
}
