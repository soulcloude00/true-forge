import type {Inventory} from './scanner.ts';
export type CoverageItem={rule:string;evaluated:number;blocked:number;note:string};
/** A coverage inventory, not a statistical confidence score or detection recall claim. */
export function ruleCoverage(i:Inventory):CoverageItem[]{
  const instances=i.instances.Reservations.flatMap(r=>r.Instances);
  const ec2Incomplete=instances.filter(x=>{const m=i.metrics[x.InstanceId];return x.InstanceType!=='t3.medium'||!m||m.cpuDailyPercent?.length!==14||m.networkDailyBytes?.length!==14||m.cpuDailyPercent.some(n=>!Number.isFinite(n))||m.networkDailyBytes.some(n=>!Number.isFinite(n))}).length;
  const albIncomplete=i.loadBalancers.LoadBalancers.filter(x=>{const m=i.metrics[x.LoadBalancerName];return !m||m.requestCountDaily?.length!==14||m.requestCountDaily.some(n=>!Number.isFinite(n))||m.healthyTargets===undefined}).length;
  return [
    {rule:'EBS storage',evaluated:i.volumes.Volumes.length,blocked:i.volumes.Volumes.filter(v=>v.VolumeType!=='gp3'||v.Attachments===undefined).length,note:'Requires a matching gp3 rate and an explicit attachment list; incomplete data is excluded. Contents and owner remain unknown.'},
    {rule:'Public IPv4',evaluated:i.addresses.Addresses.length,blocked:0,note:'Association fields from the input. DNS and cutover plans remain unknown.'},
    {rule:'EC2 utilization',evaluated:instances.length,blocked:ec2Incomplete,note:'Requires a t3.medium rate match and 14 daily CPU and network readings for each instance. Other instance types are excluded.'},
    {rule:'Load balancer traffic',evaluated:i.loadBalancers.LoadBalancers.length,blocked:albIncomplete,note:'Requires 14 daily request readings and healthy-target count.'},
    {rule:'Snapshot age',evaluated:i.snapshots.Snapshots.length,blocked:i.snapshots.Snapshots.filter(s=>s.StorageTier!=='standard'||!s.VolumeId).length,note:'Requires a standard-tier snapshot rate and source volume ID. Retention policy and stored changed blocks unknown.'}
  ];
}
