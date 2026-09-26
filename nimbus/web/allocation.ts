import type {Finding,Inventory} from './scanner.ts';
export type AllocationRow={value:string;count:number;estimatedMonthlyUsd:number;resourceIds:string[]};
/** Groups only candidate estimates by exact imported resource tags; untagged stays visible. */
export function candidateTags(i:Inventory):string[]{
 const tags=[...i.volumes.Volumes,...i.addresses.Addresses,...i.instances.Reservations.flatMap(r=>r.Instances)].flatMap(x=>x.Tags||[]);
 return [...new Set(tags.map(t=>t.Key))].sort();
}
export function candidateAllocation(i:Inventory,findings:Finding[],key:string):AllocationRow[]{
 const resources=new Map<string,Array<{Key:string;Value:string}>>();
 for(const v of i.volumes.Volumes)resources.set('volume:'+v.VolumeId,v.Tags||[]);
 for(const a of i.addresses.Addresses)if(a.AllocationId)resources.set('ipv4:'+a.AllocationId,a.Tags||[]);
 for(const r of i.instances.Reservations)for(const x of r.Instances)resources.set('instance:'+x.InstanceId,x.Tags||[]);
 const groups=new Map<string,AllocationRow>();
 for(const f of findings){
  const value=resources.get(f.id)?.find(t=>t.Key===key)?.Value || 'Untagged / unavailable';
  const row=groups.get(value)||{value,count:0,estimatedMonthlyUsd:0,resourceIds:[]};
  row.count++;row.estimatedMonthlyUsd=Math.round((row.estimatedMonthlyUsd+f.estimatedMonthlyUsd)*100)/100;row.resourceIds.push(f.resourceId);groups.set(value,row);
 }
 return [...groups.values()].sort((a,b)=>b.estimatedMonthlyUsd-a.estimatedMonthlyUsd||a.value.localeCompare(b.value));
}
