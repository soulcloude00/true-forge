import type {Finding} from './scanner.ts';
import type {CheckId} from './checklist.ts';
import type {ReviewStage} from './review-stage.ts';
export type ReviewDecision='approved'|'kept';
export function reviewPlan(findings:Finding[],decisions:Record<string,ReviewDecision>){
  const approved=findings.filter(f=>decisions[f.id]==='approved');
  const denied=findings.filter(f=>decisions[f.id]==='kept');
  const open=findings.filter(f=>!decisions[f.id]);
  const round=(n:number)=>Math.round(n*100)/100;
  return {approved,denied,open,estimatedMonthlyCandidate:round(findings.reduce((n,f)=>n+f.estimatedMonthlyUsd,0)),estimatedMonthlyApproved:round(approved.reduce((n,f)=>n+f.estimatedMonthlyUsd,0))};
}
export function planMarkdown(findings:Finding[],decisions:Record<string,ReviewDecision>,notes:Record<string,string>,source:string,stages:Record<string,ReviewStage>={},checks:Record<string,CheckId[]>={}){
  const plan=reviewPlan(findings,decisions);
  const lines=['# Nimbus review plan','',`Source: ${source}. Input is ${source==='Local JSON (unverified)'?'unverified user-pasted JSON':'synthetic AWS-shaped fixture'}; no live AWS connection.`,`Estimated monthly candidates: $${plan.estimatedMonthlyCandidate.toFixed(2)}.`,`Approved estimate: $${plan.estimatedMonthlyApproved.toFixed(2)}. These estimates are neither realized savings nor an AWS bill.`,'',`Reviewed: ${plan.approved.length+plan.denied.length}/${findings.length}. No resource is modified by approval.`,''];
  for(const [title,group] of [['Approved for further review',plan.approved],['Denied or retained',plan.denied],['Still open',plan.open]] as const){
    lines.push(`## ${title}`,'');
    if(!group.length){lines.push('None.','');continue}
    for(const f of group){lines.push(`### ${f.title} - ${f.resourceId}`,`- Rough monthly cost: $${f.estimatedMonthlyUsd.toFixed(2)}.`,'- Evidence: '+f.evidence.join('; '),'- Before acting: '+f.recommendation,'- Risk: '+f.risk,`- Local investigation stage: ${stages[f.id]||'new'} (self-marked; not a cloud status).`,`- Self-marked prompts: ${(checks[f.id]||[]).length}/5 (not verified).`,...(notes[f.id]?['- Review note: '+notes[f.id].replace(/\s+/g,' ').trim()]:[]),'');}
  }
  lines.push('## Manual safety gate','','- Confirm account, region, resource ID, owner, dependencies, rate and current state against live AWS.','- Verify backup and recovery plan where data can be lost.','- Get separate approval for any future AWS write; a plan selection is not a cloud operation.');
  return lines.join('\n');
}
