import type { BgsrSessionImport } from '@/features/export/lib/bgsr-session-schema'
import { checkBgsrSessionVersion } from '@/features/export/lib/bgsr-session-version'
import { parseBgsrSessionFile } from '@/features/export/lib/parse-bgsr-session-file'

export interface ReadBgsrSessionFileResult {
  session: BgsrSessionImport
  warnings: string[]
}

export async function readBgsrSessionFile(file: File): Promise<ReadBgsrSessionFileResult> {
  const content = await file.text()
  let parsedJson: unknown

  try {
    parsedJson = JSON.parse(content)
  } catch {
    throw new Error('BGSR session file is not valid JSON.')
  }

  if (
    typeof parsedJson !== 'object' ||
    parsedJson === null ||
    !('format' in parsedJson) ||
    (parsedJson as { format?: unknown }).format !== 'bgsr-session'
  ) {
    throw new Error('Selected file is not a BGSR session export.')
  }

  const versionCheck = checkBgsrSessionVersion(
    (parsedJson as { version?: unknown }).version,
  )
  const session = parseBgsrSessionFile(parsedJson, versionCheck.normalizedVersion)

  return {
    session,
    warnings: versionCheck.warnings,
  }
}
