import type {Finding} from './scanner.ts';
export const reviewChecks=[
 {id:'owner',label:'Ask the resource owner'},
 {id:'dependencies',label:'Check dependencies and planned use'},
 {id:'bill',label:'Verify rate against a current bill'},
 {id:'recovery',label:'Plan rollback or recovery'},
 {id:'backup',label:'Check backup and retention'}
] as const;
export type CheckId=typeof reviewChecks[number]['id'];
/** Self-marked local checklist only, not evidence that the checks happened. */
export function checklistProgress(findings:Finding[],marked:Record<string,CheckId[]>){
 const total=findings.length*reviewChecks.length;
 const done=findings.reduce((n,f)=>n+reviewChecks.filter(c=>marked[f.id]?.includes(c.id)).length,0);
 return {done,total,complete:findings.filter(f=>reviewChecks.every(c=>marked[f.id]?.includes(c.id))).length};
}
