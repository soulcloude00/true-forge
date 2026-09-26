import type {Inventory} from './scanner.ts';
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const str=(x:unknown)=>typeof x==='string'&&x.length>0&&x.length<500;
const date=(x:unknown)=>str(x)&&Number.isFinite(Date.parse(x as string));
const num=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1_000_000;
const arr=(x:unknown,max=500):x is unknown[]=>Array.isArray(x)&&x.length<=max;
const tags=(x:unknown)=>x===undefined||arr(x,30)&&x.every(t=>obj(t)&&str(t.Key)&&str(t.Value));
const samples=(x:unknown)=>x===undefined||arr(x,14)&&x.every(v=>num(v)||typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1_000_000_000_000);
/** Parse a bounded local JSON inventory; no AWS credentials, fetch, or network. */
export function parseInventory(input:unknown):Inventory {
  if(!obj(input)||!date(input.capturedAt)||!str(input.region)||!obj(input.volumes)||!obj(input.addresses)||!obj(input.instances)||!obj(input.loadBalancers)||!obj(input.snapshots)||!obj(input.metrics)||!obj(input.rates))throw Error('Expected a synthetic inventory object with timestamp, region, AWS-shaped collections, metrics and rates.');
  const i=input as Record<string,unknown>;
  const volumes=(i.volumes as Record<string,unknown>).Volumes,addresses=(i.addresses as Record<string,unknown>).Addresses,instances=(i.instances as Record<string,unknown>).Reservations,loadBalancers=(i.loadBalancers as Record<string,unknown>).LoadBalancers,snapshots=(i.snapshots as Record<string,unknown>).Snapshots;
  if(!arr(volumes)||!arr(addresses)||!arr(instances)||!arr(loadBalancers)||!arr(snapshots))throw Error('The inventory collections must be arrays of at most 500 entries each.');
  if(!volumes.every(v=>obj(v)&&str(v.VolumeId)&&str(v.State)&&(v.VolumeType===undefined||str(v.VolumeType))&&num(v.Size)&&date(v.CreateTime)&&(v.Attachments===undefined||arr(v.Attachments,100))&&tags(v.Tags)))throw Error('Invalid volume record.');
  if(!addresses.every(a=>obj(a)&&str(a.PublicIp)&&(!a.AllocationId||str(a.AllocationId))&&(!a.AssociationId||str(a.AssociationId))&&(!a.NetworkInterfaceId||str(a.NetworkInterfaceId))&&(!a.InstanceId||str(a.InstanceId))&&tags(a.Tags)))throw Error('Invalid public IPv4 record.');
  if(!instances.every(r=>obj(r)&&arr(r.Instances)&&r.Instances.every(x=>obj(x)&&str(x.InstanceId)&&str(x.InstanceType)&&obj(x.State)&&str(x.State.Name)&&date(x.LaunchTime)&&tags(x.Tags))))throw Error('Invalid EC2 reservation or instance.');
  if(!loadBalancers.every(b=>obj(b)&&str(b.LoadBalancerArn)&&str(b.LoadBalancerName)&&date(b.CreatedTime)&&str(b.Type)))throw Error('Invalid load balancer record.');
  if(!snapshots.every(s=>obj(s)&&str(s.SnapshotId)&&(!s.VolumeId||str(s.VolumeId))&&date(s.StartTime)&&num(s.VolumeSize)&&(s.StorageTier===undefined||str(s.StorageTier))))throw Error('Invalid snapshot record.');
  if([...volumes,...addresses,...loadBalancers,...snapshots].some(x=>JSON.stringify(x).length>10000)||instances.some(x=>JSON.stringify(x).length>50000))throw Error('Resource record exceeds the local inspection limit.');
  const identifiers=[...volumes.map(v=>(v as Record<string,unknown>).VolumeId),...addresses.map(a=>(a as Record<string,unknown>).AllocationId||(a as Record<string,unknown>).PublicIp),...instances.flatMap(r=>(r as {Instances:Array<{InstanceId:string}>}).Instances.map(x=>x.InstanceId)),...loadBalancers.map(b=>(b as Record<string,unknown>).LoadBalancerArn),...snapshots.map(x=>(x as Record<string,unknown>).SnapshotId)];
  if(new Set(identifiers).size!==identifiers.length)throw Error('Duplicate resource identifiers in this inventory. Fix the pasted input before scanning.');
  const futureLimit=Date.parse(i.capturedAt as string)+86_400_000;
  const dateFields=[...volumes.map(v=>(v as {CreateTime:string}).CreateTime),...instances.flatMap(r=>(r as {Instances:Array<{LaunchTime:string}>}).Instances.map(x=>x.LaunchTime)),...loadBalancers.map(b=>(b as {CreatedTime:string}).CreatedTime),...snapshots.map(x=>(x as {StartTime:string}).StartTime)];
  if(dateFields.some(d=>Date.parse(d)>futureLimit))throw Error('A resource timestamp is later than inventory capture time. Fix the pasted input before scanning.');
  const metrics=i.metrics as Record<string,unknown>;
  if(Object.keys(metrics).length>2000||!Object.values(metrics).every(m=>obj(m)&&samples(m.cpuDailyPercent)&&samples(m.networkDailyBytes)&&samples(m.requestCountDaily)&&(m.healthyTargets===undefined||num(m.healthyTargets))))throw Error('Metrics must contain finite, nonnegative daily values and no more than 2,000 resources.');
  const rates=i.rates as Record<string,unknown>;
  if(!['gp3GbMonth','idleIpv4Hour','t3MediumHour','albHour','snapshotGbMonth'].every(k=>num(rates[k])))throw Error('All five fixture rate assumptions must be finite, nonnegative numbers.');
  // Project only scanner-relevant fields; imported JSON is never sent to a server by this app.
  return {capturedAt:i.capturedAt as string,region:i.region as string,accountId:str(i.accountId)?i.accountId as string:undefined,volumes:{Volumes:volumes as Inventory['volumes']['Volumes']},addresses:{Addresses:addresses as Inventory['addresses']['Addresses']},instances:{Reservations:instances as Inventory['instances']['Reservations']},loadBalancers:{LoadBalancers:loadBalancers as Inventory['loadBalancers']['LoadBalancers']},snapshots:{Snapshots:snapshots as Inventory['snapshots']['Snapshots']},metrics:metrics as Inventory['metrics'],rates:rates as Inventory['rates']};
}
