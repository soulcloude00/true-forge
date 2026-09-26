import type {Finding} from './scanner.ts';
import {ruleRisk} from './triage.ts';
export type PriorityRow={id:string;resourceId:string;kind:Finding['kind'];monthlyEstimateUsd:number;caution:string;checks:string[]};
/** A review queue, not a deletion order or measured business priority. */
export function reviewPriority(findings:Finding[],decisions:Record<string,'approved'|'kept'>):PriorityRow[]{
 const rank={critical:3,high:2,medium:1};
 return findings.filter(f=>!decisions[f.id]).map(f=>({id:f.id,resourceId:f.resourceId,kind:f.kind,monthlyEstimateUsd:f.estimatedMonthlyUsd,caution:ruleRisk(f),checks:[f.recommendation,f.risk]})).sort((a,b)=>rank[b.caution as keyof typeof rank]-rank[a.caution as keyof typeof rank]||b.monthlyEstimateUsd-a.monthlyEstimateUsd);
}
