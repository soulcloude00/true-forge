import type {Finding} from './scanner.ts';
import type {ReviewStage} from './review-stage.ts';
import type {CheckId} from './checklist.ts';
import {safeCsvCell} from './audit-export.ts';
/** Local review snapshot, with formula-safe cells. Never a verified cloud audit. */
export function findingsCsv(findings:Finding[],decisions:Record<string,'approved'|'kept'>,notes:Record<string,string>,stages:Record<string,ReviewStage>,checks:Record<string,CheckId[]>,source:string){
 const rows=[['source','resourceId','service','title','monthlyEstimateUsd','decision','investigationStage','selfMarkedPromptCount','note'],...findings.map(f=>[source,f.resourceId,f.kind,f.title,String(f.estimatedMonthlyUsd),decisions[f.id]||'unreviewed',stages[f.id]||'new',String((checks[f.id]||[]).length),notes[f.id]||''])];
 return rows.map(row=>row.map(cell=>safeCsvCell(String(cell))).join(',')).join('\r\n');
}
