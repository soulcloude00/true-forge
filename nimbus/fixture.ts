import type {Inventory} from './scanner.ts';
/** AWS describe_* response shapes. Synthetic, not copied from a customer account. */
export const fixture: Inventory = {
  capturedAt: '2026-09-25T12:00:00Z',
  accountId: '000000000000',
  region: 'us-east-1',
  volumes: { Volumes: [
    { VolumeId: 'vol-0a11ce', State: 'available', VolumeType: 'gp3', Size: 100, CreateTime: '2026-07-01T00:00:00Z', Attachments: [], Tags: [{ Key: 'janitor:managed', Value: 'true' }] },
    { VolumeId: 'vol-0b22ce', State: 'in-use', VolumeType: 'gp3', Size: 200, CreateTime: '2026-04-01T00:00:00Z', Attachments: [{InstanceId:'i-0active'}] }
  ] },
  addresses: { Addresses: [
    { AllocationId: 'eipalloc-0a11ce', PublicIp: '192.0.2.5', Tags: [{ Key: 'janitor:managed', Value: 'true' }] },
    { AllocationId: 'eipalloc-0b22ce', PublicIp: '192.0.2.6', AssociationId: 'eipassoc-123' }
  ] },
  loadBalancers: { LoadBalancers: [
    { LoadBalancerArn: 'arn:aws:elasticloadbalancing:us-east-1:000000000000:loadbalancer/app/idle/123', LoadBalancerName: 'idle', CreatedTime: '2026-06-01T00:00:00Z', Type: 'application' }
  ] },
  metrics: { // Fixture substitutes for CloudWatch GetMetricData, 14 daily periods
    'i-0idle': { cpuDailyPercent: [1,2,1,0,1,2,1,1,1,2,1,1,2,1], networkDailyBytes: Array(14).fill(1024) },
    'i-0active': { cpuDailyPercent: [35,40,50,42,37,39,54,36,29,33,38,45,40,41], networkDailyBytes: Array(14).fill(4_000_000) },
    'idle': { requestCountDaily: Array(14).fill(0), healthyTargets: 0 }
  },
  instances: { Reservations: [{ Instances: [
    { InstanceId: 'i-0idle', InstanceType: 't3.medium', State: { Name: 'running' }, LaunchTime: '2026-06-01T00:00:00Z', Tags: [{ Key: 'janitor:managed', Value: 'true' }] },
    { InstanceId: 'i-0active', InstanceType: 't3.medium', State: { Name: 'running' }, LaunchTime: '2026-06-01T00:00:00Z' }
  ] }] },
  snapshots: { Snapshots: [
    { SnapshotId: 'snap-0a11ce', VolumeId: 'vol-gone', StartTime: '2026-02-01T00:00:00Z', VolumeSize: 80, StorageTier: 'standard' }
  ] },
  // Synthetic inputs for pricing. NOT a quote, nor proof of an account's bill.
  rates: { gp3GbMonth: 0.08, idleIpv4Hour: 0.005, t3MediumHour: 0.0416, albHour: 0.0225, snapshotGbMonth: 0.05 }
};
