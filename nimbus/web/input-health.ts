import type {Inventory} from './scanner.ts';
export type InputHealth={level:'fresh'|'old'|'future'|'invalid';ageDays:number|null;warnings:string[];resources:number;rateWarnings:string[]};
/** Data provenance hints, not verification against an AWS account or bill. */
export function inputHealth(i:Inventory,now:string):InputHealth{
 const elapsed=Date.parse(now)-Date.parse(i.capturedAt);
 const ageDays=Number.isFinite(elapsed)?Math.floor(elapsed/86400000):null;
 const level=ageDays===null?'invalid':ageDays<0?'future':ageDays>30?'old':'fresh';
 const warnings:string[]=[];
 if(level==='invalid')warnings.push('Capture time is invalid; confirm the source before relying on this scan.');
 if(level==='future')warnings.push('Capture time is in the future relative to this browser; check the clock and input.');
 if(level==='old')warnings.push('Inventory is over 30 days old; recheck current resources and costs before acting.');
 warnings.push('Daily metrics are undated arrays in this shape. Nimbus cannot verify when the 14 samples were collected.');
 const rates=Object.entries(i.rates).filter(([,value])=>value===0).map(([name])=>name);
 const rateWarnings=rates.length?[`Zero input rates (${rates.join(', ')}) are assumptions, not proof of free resources.`]:[];
 const ids=[...i.volumes.Volumes.map(x=>x.VolumeId),...i.addresses.Addresses.map(x=>x.AllocationId||x.PublicIp),...i.instances.Reservations.flatMap(r=>r.Instances.map(x=>x.InstanceId)),...i.loadBalancers.LoadBalancers.map(x=>x.LoadBalancerArn),...i.snapshots.Snapshots.map(x=>x.SnapshotId)];
 if(new Set(ids).size<ids.length)warnings.push('Duplicate resource identifiers found. Review the pasted input; audit rows may not be unique.');
 return {level,ageDays,warnings,rateWarnings,resources:ids.length};
}
