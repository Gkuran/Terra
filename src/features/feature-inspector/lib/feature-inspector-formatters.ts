export function formatObservedDate(isoDate: string) {
  const parsedDate = new Date(isoDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not provided'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

export function formatAttributeLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
