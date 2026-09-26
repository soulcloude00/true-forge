import type {Finding,Inventory} from './scanner.ts';
export type TagAudit={key:string;present:number;total:number;missingIds:string[];candidateEstimateUsd:number};
/** Tag quality over all input resources. Missing tags are never treated as ownerless resources. */
export function auditTag(i:Inventory,findings:Finding[],key:string):TagAudit{
 const records:[string,{Key:string;Value:string}[]][]=[
  ...i.volumes.Volumes.map(v=>[v.VolumeId,v.Tags||[]] as [string,{Key:string;Value:string}[]]),
  ...i.addresses.Addresses.map(a=>[a.AllocationId||a.PublicIp,a.Tags||[]] as [string,{Key:string;Value:string}[]]),
  ...i.instances.Reservations.flatMap(r=>r.Instances.map(x=>[x.InstanceId,x.Tags||[]] as [string,{Key:string;Value:string}[]])),
  ...i.loadBalancers.LoadBalancers.map(x=>[x.LoadBalancerArn,[]] as [string,{Key:string;Value:string}[]]),
  ...i.snapshots.Snapshots.map(x=>[x.SnapshotId,[]] as [string,{Key:string;Value:string}[]])
 ];
 const missingIds=records.filter(([,tags])=>!tags.some(t=>t.Key===key&&t.Value.trim())).map(([id])=>id);
 const missing=new Set(missingIds);
 return {key,present:records.length-missingIds.length,total:records.length,missingIds,candidateEstimateUsd:Math.round(findings.filter(f=>missing.has(f.resourceId)).reduce((n,f)=>n+f.estimatedMonthlyUsd,0)*100)/100};
}
