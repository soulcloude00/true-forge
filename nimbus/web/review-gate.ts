import type {Finding} from './scanner.ts';
import {ruleRisk} from './triage.ts';
export type ReviewGate={id:string;resourceId:string;reasons:string[]};
/** Local plan warnings only; neither a policy engine nor permission to touch a cloud account. */
export function reviewGates(findings:Finding[],decisions:Record<string,'approved'|'kept'>,threshold:number):ReviewGate[]{
 const cap=Number.isFinite(threshold)&&threshold>=0?threshold:0;
 return findings.filter(f=>decisions[f.id]==='approved').map(f=>{
  const reasons:string[]=[];
  if(f.estimatedMonthlyUsd>cap)reasons.push(`Rough monthly estimate exceeds the $${cap.toFixed(2)} review threshold.`);
  if(ruleRisk(f)==='critical')reasons.push('Critical rule caution; verify retention and recovery separately.');
  return {id:f.id,resourceId:f.resourceId,reasons};
 }).filter(g=>g.reasons.length>0);
}
