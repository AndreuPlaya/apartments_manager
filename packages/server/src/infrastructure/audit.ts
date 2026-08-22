import { appendFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { ensureDir } from './fs.js'
import { PATHS } from './paths.js'

export interface AuditEntry {
  timestamp: string
  username: string
  isAdmin: boolean
  action: 'create' | 'update' | 'delete' | 'override'
  resource: string
  resourceId?: string
}

export function logAudit(entry: AuditEntry): void {
  try {
    ensureDir(dirname(PATHS.auditLogJsonl))
    appendFileSync(PATHS.auditLogJsonl, JSON.stringify(entry) + '\n', 'utf8')
  } catch {
    // Non-fatal: audit log failure must not break the request
  }
}
