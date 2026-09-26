import type {Finding,Inventory} from './scanner.ts';
export type MetricEvidence={label:string;values:number[];unit:string;threshold:number;description:string};
/** Raw undated fixture samples, not an account trend or anomaly detector. */
export function metricEvidence(f:Finding,i:Inventory):MetricEvidence[]{
 const record=f.kind==='instance'?i.metrics[f.resourceId]:f.kind==='load-balancer'?i.metrics[i.loadBalancers.LoadBalancers.find(x=>x.LoadBalancerArn===f.resourceId)?.LoadBalancerName||'']:undefined;
 if(!record)return [];
 const rows:MetricEvidence[]=[];
 if(f.kind==='instance'){
  if(record.cpuDailyPercent?.length===14)rows.push({label:'CPU by supplied sample',values:[...record.cpuDailyPercent],unit:'%',threshold:5,description:'Under 5% in all 14 samples is one lead signal.'});
  if(record.networkDailyBytes?.length===14)rows.push({label:'Network by supplied sample',values:[...record.networkDailyBytes],unit:'B',threshold:100000,description:'Under 100 KB in all 14 samples is another lead signal.'});
 }
 if(f.kind==='load-balancer'&&record.requestCountDaily?.length===14)rows.push({label:'Requests by supplied sample',values:[...record.requestCountDaily],unit:'requests',threshold:1,description:'Zero requests in all 14 samples is one lead signal.'});
 return rows;
}
