export const currentBgsrSessionVersion = 1

export interface BgsrSessionVersionCheck {
  normalizedVersion: number
  warnings: string[]
}

export function checkBgsrSessionVersion(value: unknown): BgsrSessionVersionCheck {
  if (value === undefined) {
    return {
      normalizedVersion: currentBgsrSessionVersion,
      warnings: [
        'This BGSR session file has no explicit version metadata. It was imported using legacy compatibility mode.',
      ],
    }
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error('BGSR session version metadata is invalid.')
  }

  if (value > currentBgsrSessionVersion) {
    throw new Error(
      `This BGSR session was exported with version ${value}, which is newer than the supported version ${currentBgsrSessionVersion}.`,
    )
  }

  return {
    normalizedVersion: value,
    warnings:
      value < currentBgsrSessionVersion
        ? [
            `This BGSR session was exported with version ${value}. Compatibility mode was applied during import.`,
          ]
        : [],
  }
}
