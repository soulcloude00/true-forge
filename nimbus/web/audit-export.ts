import type {AuditRow} from './audit.ts';
/** Export the complete local audit, including exclusions. Never interpret an exclusion as safe. */
export function safeCsvCell(value:string):string {
  const raw=String(value).replace(/\r?\n/g,' ');
  const literal=/^[\s]*[=+\-@]/.test(raw)?`'${raw}`:raw;
  return `\"${literal.replace(/\"/g,'\"\"')}\"`;
}
export function auditCsv(rows:AuditRow[],source:string):string {
  return [['source','resourceId','service','scanStatus','reason'],...rows.map(r=>[source,r.resourceId,r.service,r.status,r.why])].map(row=>row.map(safeCsvCell).join(',')).join('\r\n');
}
