import {EC2Client,DescribeInstancesCommand,DescribeVolumesCommand,DescribeAddressesCommand,DescribeSnapshotsCommand,CreateTagsCommand} from '@aws-sdk/client-ec2';
import {ElasticLoadBalancingV2Client,DescribeLoadBalancersCommand} from '@aws-sdk/client-elastic-load-balancing-v2';
import {STSClient,GetCallerIdentityCommand} from '@aws-sdk/client-sts';
import {CostExplorerClient,GetCostAndUsageCommand} from '@aws-sdk/client-cost-explorer';

const MAX_PAGES=20;
type Pages<T>={items:T[];truncated:boolean};
export async function collectPages<T>(fetchPage:(token?:string)=>Promise<{items:T[];token?:string}>,maxPages=MAX_PAGES):Promise<Pages<T>>{
 const items:T[]=[];let token:string|undefined;
 for(let page=0;page<maxPages;page++){
  const result=await fetchPage(token);items.push(...result.items);token=result.token;
  if(!token)return {items,truncated:false};
 }
 return {items,truncated:!!token};
}
export type AwsReport={source:'live AWS, read only';region:string;accountId:string;capturedAt:string;counts:{instances:number;volumes:number;addresses:number;loadBalancers:number;snapshots:number};coverage:{maxPagesPerService:number;truncatedServices:string[]};resources:{instances:Array<{id:string;type:string;state:string}>;volumes:Array<{id:string;sizeGiB:number;state:string;type:string;attached:number}>;addresses:Array<{allocationId:string|null;ip:string;associated:boolean}>;loadBalancers:Array<{arn:string;name:string;type:string}>;snapshots:Array<{id:string;sourceVolumeId:string|null;sizeGiB:number}>};warning:string};
export async function getInventory(region=process.env.AWS_REGION||'us-east-1'):Promise<AwsReport>{
 if(!/^[a-z]{2}-[a-z-]+-\d$/.test(region))throw Error('Invalid AWS region');
 const ec2=new EC2Client({region}),elb=new ElasticLoadBalancingV2Client({region}),sts=new STSClient({region});
 const identity=await sts.send(new GetCallerIdentityCommand({}));
 if(!identity.Account)throw Error('AWS account identity not returned');
 const [instances,volumes,addresses,lbs,snapshots]=await Promise.all([
  collectPages(async token=>{const r=await ec2.send(new DescribeInstancesCommand({MaxResults:100,NextToken:token}));return {items:r.Reservations||[],token:r.NextToken};}),
  collectPages(async token=>{const r=await ec2.send(new DescribeVolumesCommand({MaxResults:100,NextToken:token}));return {items:r.Volumes||[],token:r.NextToken};}),
  collectPages(async token=>{const r=await ec2.send(new DescribeAddressesCommand({NextToken:token}));return {items:r.Addresses||[],token:r.NextToken};}),
  collectPages(async token=>{const r=await elb.send(new DescribeLoadBalancersCommand({PageSize:100,Marker:token}));return {items:r.LoadBalancers||[],token:r.NextMarker};}),
  collectPages(async token=>{const r=await ec2.send(new DescribeSnapshotsCommand({OwnerIds:['self'],MaxResults:100,NextToken:token}));return {items:r.Snapshots||[],token:r.NextToken};})
 ]);
 const rows={instances:instances.items.flatMap(r=>r.Instances||[]).map(x=>({id:x.InstanceId||'',type:x.InstanceType||'',state:x.State?.Name||''})),volumes:volumes.items.map(x=>({id:x.VolumeId||'',sizeGiB:x.Size||0,state:x.State||'',type:x.VolumeType||'',attached:x.Attachments?.length||0})),addresses:addresses.items.map(x=>({allocationId:x.AllocationId||null,ip:x.PublicIp||'',associated:!!(x.AssociationId||x.NetworkInterfaceId||x.InstanceId)})),loadBalancers:lbs.items.map(x=>({arn:x.LoadBalancerArn||'',name:x.LoadBalancerName||'',type:x.Type||''})),snapshots:snapshots.items.map(x=>({id:x.SnapshotId||'',sourceVolumeId:x.VolumeId||null,sizeGiB:x.VolumeSize||0}))};
 const truncatedServices=[['instances',instances],['volumes',volumes],['addresses',addresses],['loadBalancers',lbs],['snapshots',snapshots]].filter(([,page])=>page.truncated).map(([name])=>name as string);
 return {source:'live AWS, read only',region,accountId:identity.Account,capturedAt:new Date().toISOString(),counts:{instances:rows.instances.length,volumes:rows.volumes.length,addresses:rows.addresses.length,loadBalancers:rows.loadBalancers.length,snapshots:rows.snapshots.length},coverage:{maxPagesPerService:MAX_PAGES,truncatedServices},resources:rows,warning:`Inventory uses paginated read-only AWS APIs and stops after ${MAX_PAGES} pages per service; truncated services are listed in coverage. No utilization metrics, complete billing attribution, or deletion safety has been verified.`};
}
export async function getBilling(month:string){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Use YYYY-MM');
 const end=new Date(`${month}-01T00:00:00Z`);end.setUTCMonth(end.getUTCMonth()+1);
 const client=new CostExplorerClient({region:'us-east-1'});
 const pages=await collectPages(async token=>{
  const result=await client.send(new GetCostAndUsageCommand({TimePeriod:{Start:`${month}-01`,End:end.toISOString().slice(0,10)},Granularity:'MONTHLY',Metrics:['UnblendedCost'],GroupBy:[{Type:'DIMENSION',Key:'SERVICE'}],NextPageToken:token}));
  return {items:(result.ResultsByTime||[]).flatMap(t=>t.Groups||[]).map(g=>({service:g.Keys?.[0]||'',amount:g.Metrics?.UnblendedCost?.Amount||'',unit:g.Metrics?.UnblendedCost?.Unit||''})),token:result.NextPageToken};
 });
 return {source:'AWS Cost Explorer, read only',month,services:pages.items,coverage:{maxPages:MAX_PAGES,truncated:pages.truncated},warning:`Service totals are account-level; they do not attribute cost to resource IDs, prove waste, or equal projected savings.${pages.truncated?' Cost Explorer pagination reached the 20-page safety limit; results are incomplete.':''}`};
}

export async function getDailyBilling(days=14){
 if(!Number.isInteger(days)||days<7||days>31)throw Error('days must be a whole number between 7 and 31');
 const end=new Date();end.setUTCHours(0,0,0,0);
 const start=new Date(end);start.setUTCDate(start.getUTCDate()-days);
 const startDate=start.toISOString().slice(0,10),endDate=end.toISOString().slice(0,10);
 const client=new CostExplorerClient({region:'us-east-1'});
 const pages=await collectPages(async token=>{
  const result=await client.send(new GetCostAndUsageCommand({TimePeriod:{Start:startDate,End:endDate},Granularity:'DAILY',Metrics:['UnblendedCost'],GroupBy:[{Type:'DIMENSION',Key:'SERVICE'}],NextPageToken:token}));
  return {items:(result.ResultsByTime||[]).flatMap(day=>(day.Groups||[]).map(group=>({date:day.TimePeriod?.Start||'',service:group.Keys?.[0]||'',amount:group.Metrics?.UnblendedCost?.Amount||'',unit:group.Metrics?.UnblendedCost?.Unit||''}))),token:result.NextPageToken};
 });
 return {source:'AWS Cost Explorer, read only',startDate,endDateExclusive:endDate,days,granularity:'DAILY',services:pages.items,coverage:{maxPages:MAX_PAGES,truncated:pages.truncated},warning:`Daily totals are account/service-level, not resource attribution. Cost Explorer data is delayed and recent days may be incomplete; compare only dates with adequate data freshness. This evidence does not prove waste or savings.${pages.truncated?' Pagination reached the 20-page safety limit; results are incomplete.':''}`};
}

export async function markVolumeForReview(input:{region:string;volumeId:string;expectedAccountId:string}){
 const {region,volumeId,expectedAccountId}=input;
 if(!/^[a-z]{2}-[a-z-]+-\d$/.test(region))throw Error('Invalid AWS region');
 if(!/^vol-[0-9a-f]+$/.test(volumeId))throw Error('Invalid EBS volume ID');
 if(!/^\d{12}$/.test(expectedAccountId))throw Error('Expected account ID must be 12 digits');
 const sts=new STSClient({region});
 const identity=await sts.send(new GetCallerIdentityCommand({}));
 if(identity.Account!==expectedAccountId)throw Error('AWS account does not match the account shown in the review evidence');
 const ec2=new EC2Client({region});
 const result=await ec2.send(new DescribeVolumesCommand({VolumeIds:[volumeId]}));
 const volume=result.Volumes?.find(item=>item.VolumeId===volumeId);
 if(!volume)throw Error('The requested volume was not found in this account and region');
 if(volume.State!=='available'||(volume.Attachments?.length||0)>0)throw Error('Only a currently available, unattached EBS volume can receive this review tag');
 const existingTag=volume.Tags?.find(tag=>tag.Key==='nimbus:review-state');
 if(existingTag&&existingTag.Value!=='candidate-for-human-review')throw Error('The volume already has a different nimbus:review-state tag; refusing to overwrite it');
 if(existingTag?.Value==='candidate-for-human-review')return {source:'AWS EC2 DescribeVolumes',accountId:identity.Account,region,volumeId,tag:{key:'nimbus:review-state',value:'candidate-for-human-review'},effect:'Review marker was already present; no change was made.'};
 await ec2.send(new CreateTagsCommand({Resources:[volumeId],Tags:[{Key:'nimbus:review-state',Value:'candidate-for-human-review'}]}));
 return {source:'AWS EC2 CreateTags',accountId:identity.Account,region,volumeId,tag:{key:'nimbus:review-state',value:'candidate-for-human-review'},effect:'Added a reversible review marker only. No resource was stopped or deleted.'};
}
