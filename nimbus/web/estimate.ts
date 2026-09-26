import type {Finding,Inventory} from './scanner.ts';
export type EstimateDetail={formula:string;unitRate:string;assumption:string;coverage:string};
export function explainEstimate(f:Finding,i:Inventory):EstimateDetail {
  const r=i.rates;
  if(f.kind==='volume'){
    const v=i.volumes.Volumes.find(x=>x.VolumeId===f.resourceId);
    return {formula:`${v?.Size??'?'} GB × $${r.gp3GbMonth.toFixed(4)} / GB-month`,unitRate:'Input gp3 rate',assumption:'Treats provisioned size as gp3 and omits IOPS, throughput, and regional price differences.',coverage:'Current allocation, not a measured bill.'};
  }
  if(f.kind==='ipv4')return {formula:`730 hours × $${r.idleIpv4Hour.toFixed(4)} / hour`,unitRate:'Input idle IPv4 rate',assumption:'Uses a flat 730-hour month and a manually supplied rate.',coverage:'No actual billing or reservation value checked.'};
  if(f.kind==='instance')return {formula:`730 hours × $${r.t3MediumHour.toFixed(4)} / hour`,unitRate:'Input t3.medium rate',assumption:'Uses a flat 730-hour month and assumes this instance matches the supplied t3.medium rate. No savings plan, spot, taxes, disks or data transfer.',coverage:'Idle signal is based on 14 daily metric samples, not proof of unused capacity.'};
  if(f.kind==='load-balancer')return {formula:`730 hours × $${r.albHour.toFixed(4)} / hour`,unitRate:'Input ALB hourly rate',assumption:'Omits load-balancer capacity units and data transfer.',coverage:'Zero requests in the supplied 14-day series; future traffic may still depend on it.'};
  const s=i.snapshots.Snapshots.find(x=>x.SnapshotId===f.resourceId);
  return {formula:`${s?.VolumeSize??'?'} GB × $${r.snapshotGbMonth.toFixed(4)} / GB-month`,unitRate:'Input snapshot GB rate',assumption:'A deliberately rough upper-shape estimate: snapshots bill on changed blocks, not source volume size.',coverage:'Backup retention and restore dependencies are not known.'};
}
