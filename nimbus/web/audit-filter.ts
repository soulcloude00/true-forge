import type {AuditRow} from './audit.ts';
export type AuditStatus='all'|'flagged'|'not flagged';
/** Triage the complete inventory, including excluded resources. */
export function filterAudit(rows:AuditRow[],query:string,status:AuditStatus):AuditRow[]{
  const needle=query.trim().toLocaleLowerCase();
  return rows.filter(row=>(status==='all'||row.status===status)&&(!needle||`${row.resourceId} ${row.service} ${row.status} ${row.why}`.toLocaleLowerCase().includes(needle)));
}
