import type {Finding} from './scanner.ts';
export type ReviewStage='new'|'investigating'|'on-hold';
/** Local investigation labels, separate from approval decisions and not cloud state. */
export function stageCounts(findings:Finding[],stages:Record<string,ReviewStage>){
 return findings.reduce((out,f)=>{out[stages[f.id]||'new']++;return out},{new:0,investigating:0,'on-hold':0} as Record<ReviewStage,number>);
}
export function filterByStage(findings:Finding[],stages:Record<string,ReviewStage>,selected:ReviewStage|'all'){
 return selected==='all'?findings:findings.filter(f=>(stages[f.id]||'new')===selected);
}
