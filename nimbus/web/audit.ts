import type {Finding,Inventory} from './scanner.ts';

export type AuditRow={resourceId:string;service:string;status:'flagged'|'not flagged';why:string};
/** Explains the fixture scan outcome; intentionally no cloud/API access. */
export function auditInventory(i:Inventory,findings:Finding[]):AuditRow[]{
  const matched=new Set(findings.map(f=>f.resourceId));
  const rows:AuditRow[]=[];
  const add=(resourceId:string,service:string,quiet:string)=>rows.push({resourceId,service,status:matched.has(resourceId)?'flagged':'not flagged',why:matched.has(resourceId)?findings.find(f=>f.resourceId===resourceId)!.explanation:quiet});
  for(const v of i.volumes.Volumes)add(v.VolumeId,'EBS volume',v.Attachments===undefined?'Attachment data missing; cannot call it unattached.':v.Attachments.length?'Attached to an instance.':v.State!=='available'?'Volume state is not available.':v.VolumeType!=='gp3'?'No matching gp3 rate for this volume type; excluded rather than inventing a price.':'Too new to flag as an unattached volume.');
  for(const a of i.addresses.Addresses)add(a.AllocationId||a.PublicIp,'Public IPv4',a.AssociationId||a.InstanceId||a.NetworkInterfaceId?'Address is associated with a resource.':'No eligible allocation ID.');
  for(const r of i.instances.Reservations)for(const x of r.Instances){const m=i.metrics[x.InstanceId];add(x.InstanceId,'EC2 instance',!m||m.cpuDailyPercent?.length!==14||m.networkDailyBytes?.length!==14?'Missing a complete 14-day CPU and network window.':x.State.Name!=='running'?'Instance is not running.':x.InstanceType!=='t3.medium'?'No supplied rate for this instance type; excluded rather than inventing a price.':'Observed CPU or network activity is above the idle threshold.');}
  for(const b of i.loadBalancers.LoadBalancers){const m=i.metrics[b.LoadBalancerName];add(b.LoadBalancerArn,'Load balancer',!m||m.requestCountDaily?.length!==14?'Missing a complete 14-day request window.':m.requestCountDaily?.some(n=>n!==0)?'Observed requests in the sample window.':'Healthy targets or another safeguard prevented a lead.');}
  for(const s of i.snapshots.Snapshots)add(s.SnapshotId,'Snapshot',!s.VolumeId?'Source volume ID missing; cannot establish source absence.':i.volumes.Volumes.some(v=>v.VolumeId===s.VolumeId)?'Source volume is still present.':s.StorageTier!=='standard'?'No matching standard-tier snapshot rate; excluded rather than inventing a price.':'Snapshot is too recent to flag.');
  return rows;
}
