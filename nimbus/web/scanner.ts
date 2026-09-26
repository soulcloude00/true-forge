export type Finding = {
  id: string; resourceId: string; region: string; kind: 'volume'|'ipv4'|'instance'|'load-balancer'|'snapshot';
  title: string; explanation: string; estimatedMonthlyUsd: number; evidence: string[];
  recommendation: string; risk: string; eligibleForAction: boolean;
};
export type Inventory = {
  capturedAt: string; region: string; accountId?: string;
  volumes: { Volumes: Array<{VolumeId:string; State:string; Size:number; VolumeType?:string; CreateTime:string; Attachments?:unknown[]; Tags?:Array<{Key:string;Value:string}>}> };
  addresses: { Addresses: Array<{AllocationId?:string; PublicIp:string; AssociationId?:string; NetworkInterfaceId?:string; InstanceId?:string; Tags?:Array<{Key:string;Value:string}>}> };
  instances: { Reservations: Array<{Instances: Array<{InstanceId:string;InstanceType:string;State:{Name:string};LaunchTime:string;Tags?:Array<{Key:string;Value:string}>}>}> };
  loadBalancers: {LoadBalancers:Array<{LoadBalancerArn:string;LoadBalancerName:string;CreatedTime:string;Type:string}>};
  snapshots: {Snapshots:Array<{SnapshotId:string;VolumeId?:string;StartTime:string;VolumeSize:number;StorageTier?:string}>};
  metrics: Record<string,{cpuDailyPercent?:readonly number[];networkDailyBytes?:readonly number[];requestCountDaily?:readonly number[];healthyTargets?:number}>;
  rates: {gp3GbMonth:number;idleIpv4Hour:number;t3MediumHour:number;albHour:number;snapshotGbMonth:number};
};
const hours = 730;
const money = (n:number) => Math.round(n * 100) / 100;
const ageDays = (at:string, now:string) => (Date.parse(now)-Date.parse(at))/86400000;
const tagged = (tags?:Array<{Key:string;Value:string}>) => tags?.some(t => t.Key === 'janitor:managed' && t.Value === 'true') ?? false;
function finding(i:Inventory, kind:Finding['kind'], id:string, title:string, explanation:string, estimatedMonthlyUsd:number, evidence:string[], recommendation:string, risk:string, eligibleForAction=false): Finding {
  return {id:`${kind}:${id}`,resourceId:id,region:i.region,kind,title,explanation,estimatedMonthlyUsd:money(estimatedMonthlyUsd),evidence,recommendation,risk,eligibleForAction};
}
/** Read-only scan. No AWS SDK calls or mutation paths. Unknown metrics mean no idle finding. */
export function scan(i:Inventory, now=i.capturedAt): Finding[] {
  if (!Number.isFinite(Date.parse(now))) throw new Error('Invalid scan timestamp');
  const out:Finding[]=[];
  for (const v of i.volumes.Volumes) {
    if(v.State !== 'available' || v.VolumeType !== 'gp3' || !Array.isArray(v.Attachments) || v.Attachments.length>0 || ageDays(v.CreateTime,now)<7) continue;
    const days=Math.floor(ageDays(v.CreateTime,now));
    out.push(finding(i,'volume',v.VolumeId,'Unattached EBS volume',`This ${v.Size} GB disk was created ${days} days ago and is unattached in this input. Its attachment history is unknown; it may still hold data.`,v.Size*i.rates.gp3GbMonth,[`State: ${v.State}`,`Attachments: ${v.Attachments?.length ?? 0}`,`Created: ${v.CreateTime}`],'Review contents and create a verified backup before considering deletion.','High: deleting a volume can lose data.',false));
  }
  for (const a of i.addresses.Addresses) {
    if(a.AssociationId || a.NetworkInterfaceId || a.InstanceId || !a.AllocationId) continue;
    out.push(finding(i,'ipv4',a.AllocationId,'Unassociated public IPv4 address',`This allocated address (${a.PublicIp}) has no association. Confirm it is not reserved for a future cutover.`,hours*i.rates.idleIpv4Hour,[`IP: ${a.PublicIp}`,'No association, instance, or network interface returned'],'Release only after checking DNS and planned failovers.','Medium: release may lose a reserved address.',tagged(a.Tags)));
  }
  for (const reservation of i.instances.Reservations) for (const instance of reservation.Instances) {
    if(instance.State.Name !== 'running' || instance.InstanceType !== 't3.medium' || ageDays(instance.LaunchTime,now)<14) continue;
    const m=i.metrics[instance.InstanceId];
    if(!m || m.cpuDailyPercent?.length!==14 || m.networkDailyBytes?.length!==14 || m.cpuDailyPercent.some(x=>!Number.isFinite(x) || x>=5) || m.networkDailyBytes.some(x=>!Number.isFinite(x) || x>=100_000)) continue;
    out.push(finding(i,'instance',instance.InstanceId,'Possibly idle EC2 instance',`This running ${instance.InstanceType} server stayed below 5% daily CPU and 100 KB daily network traffic across the 14 sampled days. CPU alone cannot prove it is unused.`,hours*i.rates.t3MediumHour,[`State: ${instance.State.Name}`,'14 daily CPU and network samples below thresholds'],'Ask its owner, check jobs and logs, then schedule a reversible stop.','High: stopping may interrupt work; storage charges remain.',false));
  }
  for (const lb of i.loadBalancers.LoadBalancers) {
    const m=i.metrics[lb.LoadBalancerName];
    if(lb.Type !== 'application' || ageDays(lb.CreatedTime,now)<14 || !m || m.requestCountDaily?.length!==14 || m.requestCountDaily.some(x=>x!==0) || m.healthyTargets!==0) continue;
    out.push(finding(i,'load-balancer',lb.LoadBalancerArn,'Possibly unused load balancer',`This load balancer showed zero requests for 14 sampled days and has no healthy targets. Check its listeners and deployment plans before removal.`,hours*i.rates.albHour,[`Name: ${lb.LoadBalancerName}`,'Zero requests in 14 daily samples','Zero healthy targets'],'Review DNS, listeners, target groups, and ownership.','High: deletion can break future traffic.',false));
  }
  for (const s of i.snapshots.Snapshots) {
    if(s.StorageTier !== 'standard' || !s.VolumeId || ageDays(s.StartTime,now)<90 || i.volumes.Volumes.some(v=>v.VolumeId===s.VolumeId)) continue;
    out.push(finding(i,'snapshot',s.SnapshotId,'Old snapshot without a current source volume',`This snapshot is at least ${Math.floor(ageDays(s.StartTime,now))} days old and its source volume was not found. That does not make it safe to delete.`,s.VolumeSize*i.rates.snapshotGbMonth,[`Created: ${s.StartTime}`,`Source volume: ${s.VolumeId ?? 'unknown'}`],'Check backup policy and restore references before any deletion.','Critical: backup loss may be irreversible.',false));
  }
  return out.sort((a,b)=>b.estimatedMonthlyUsd-a.estimatedMonthlyUsd);
}
