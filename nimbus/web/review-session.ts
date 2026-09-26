import type {Finding,Inventory} from './scanner.ts';
import {reviewChecks,type CheckId} from './checklist.ts';
import type {ReviewStage} from './review-stage.ts';
export type LocalReview={decisions:Record<string,'approved'|'kept'>;notes:Record<string,string>;stages:Record<string,ReviewStage>;checked:Record<string,CheckId[]>};
const keys=new Set(reviewChecks.map(c=>c.id));
const object=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
/** Export only current local review, tied to the exact scan inputs. No cloud or shared storage. */
export function reviewSession(i:Inventory,findings:Finding[],state:LocalReview){
 return JSON.stringify({format:'nimbus-local-review-v1',capturedAt:i.capturedAt,region:i.region,accountId:i.accountId||null,inventorySnapshot:JSON.stringify(i),resourceIds:findings.map(f=>f.id),state},null,2);
}
/** Fail closed if inventory or lead set differs, rather than attach notes to another scan. */
export function restoreReviewSession(text:string,i:Inventory,findings:Finding[]):LocalReview{
 if(text.length>2_000_000)throw Error('Review JSON must be under 2 MB.');
 let d:unknown;try{d=JSON.parse(text)}catch{throw Error('Review JSON could not be parsed.');}
 if(!object(d)||d.format!=='nimbus-local-review-v1'||d.capturedAt!==i.capturedAt||d.region!==i.region||d.accountId!==(i.accountId||null)||d.inventorySnapshot!==JSON.stringify(i)||!Array.isArray(d.resourceIds)||JSON.stringify(d.resourceIds)!==JSON.stringify(findings.map(f=>f.id)))throw Error('Review does not match this scan. Re-run the original inventory before restoring.');
 if(!object(d.state))throw Error('Review state is missing.');
 const state=d.state;
 const ids=new Set(findings.map(f=>f.id));
 function record(key:string,valid:(x:unknown)=>boolean){const value=state[key];if(!object(value)||Object.entries(value).some(([id,v])=>!ids.has(id)||!valid(v)))throw Error(`Invalid ${key} in review JSON.`);return value;}
 const decisions=record('decisions',x=>x==='approved'||x==='kept');
 const notes=record('notes',x=>typeof x==='string'&&x.length<=3000);
 const stages=record('stages',x=>x==='new'||x==='investigating'||x==='on-hold');
 const checked=record('checked',x=>Array.isArray(x)&&x.length<=reviewChecks.length&&new Set(x).size===x.length&&x.every(y=>keys.has(y)));
 return {decisions:decisions as LocalReview['decisions'],notes:notes as LocalReview['notes'],stages:stages as LocalReview['stages'],checked:checked as LocalReview['checked']};
}
