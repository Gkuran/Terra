export function buildSharedOccurrenceLink(occurrenceKey: number) {
  if (typeof window === 'undefined') {
    return `/?sharedOccurrenceKey=${occurrenceKey}`
  }

  const shareUrl = new URL(window.location.pathname, window.location.origin)
  shareUrl.searchParams.set('sharedOccurrenceKey', String(occurrenceKey))

  return shareUrl.toString()
}
