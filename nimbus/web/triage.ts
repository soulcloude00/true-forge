import type {Finding} from './scanner.ts';
export type RiskFilter='all'|'critical'|'high'|'medium';
export type FindingSort='cost-desc'|'cost-asc'|'name'|'risk';
const severity:Record<Exclude<RiskFilter,'all'>,number>={critical:3,high:2,medium:1};
/** Rule-level caution, not a measured business-impact score. */
export function ruleRisk(f:Finding):Exclude<RiskFilter,'all'>{
 const value=f.risk.split(':',1)[0].toLowerCase();
 return value==='critical'||value==='high'?value:'medium';
}
export function triageFindings(findings:Finding[],risk:RiskFilter,sort:FindingSort):Finding[]{
 const selected=findings.filter(f=>risk==='all'||ruleRisk(f)===risk);
 return selected.sort((a,b)=>sort==='risk'?(severity[ruleRisk(b)]-severity[ruleRisk(a)]||b.estimatedMonthlyUsd-a.estimatedMonthlyUsd):sort==='cost-asc'?a.estimatedMonthlyUsd-b.estimatedMonthlyUsd:sort==='name'?a.title.localeCompare(b.title):b.estimatedMonthlyUsd-a.estimatedMonthlyUsd);
}
