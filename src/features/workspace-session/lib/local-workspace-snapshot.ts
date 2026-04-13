import { buildBgsrSessionExport } from '@/features/export/lib/build-bgsr-session-export'
import { parseBgsrSessionFile } from '@/features/export/lib/parse-bgsr-session-file'
import { checkBgsrSessionVersion } from '@/features/export/lib/bgsr-session-version'

const localWorkspaceSnapshotKey = 'bgsr-active-workspace'

export function readLocalWorkspaceSnapshot() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(localWorkspaceSnapshotKey)

  if (!rawValue) {
    return null
  }

  const parsedJson = JSON.parse(rawValue) as unknown
  const versionCheck =
    typeof parsedJson === 'object' && parsedJson !== null && 'version' in parsedJson
      ? checkBgsrSessionVersion((parsedJson as { version?: unknown }).version)
      : checkBgsrSessionVersion(undefined)

  return parseBgsrSessionFile(parsedJson, versionCheck.normalizedVersion)
}

export function removeLocalWorkspaceSnapshot() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(localWorkspaceSnapshotKey)
}

export function writeLocalWorkspaceSnapshot(
  input: Parameters<typeof buildBgsrSessionExport>[0],
) {
  if (typeof window === 'undefined') {
    return
  }

  const snapshot = buildBgsrSessionExport(input)
  window.localStorage.setItem(localWorkspaceSnapshotKey, JSON.stringify(snapshot))
}
