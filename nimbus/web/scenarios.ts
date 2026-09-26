import {fixture} from './fixture.ts';
import type {Inventory} from './scanner.ts';
export type Scenario = 'baseline'|'active'|'incomplete'|'none';
export const scenarios:Record<Scenario,{title:string;description:string}> = {
  baseline:{title:'Baseline sample',description:'Five resource leads from a mixed synthetic inventory.'},
  active:{title:'Activity changes the answer',description:'A busy server, used load balancer, and attached volume should not appear as waste.'},
  incomplete:{title:'Missing metrics, cautious scan',description:'Incomplete CPU and request history should suppress idle claims.'},
  none:{title:'No candidates in this sample',description:'Every sample resource has an observed reason not to be flagged; this is not proof of zero waste.'}
};
/** Built-in synthetic variants. No network calls or customer data. */
export function inventoryFor(scenario:Scenario):Inventory {
  const copy=structuredClone(fixture);
  if(scenario==='active'){
    copy.metrics['i-0idle'].cpuDailyPercent=Array(14).fill(22);
    copy.metrics.idle.requestCountDaily=Array(14).fill(12);
    copy.volumes.Volumes[0].State='in-use';
    copy.volumes.Volumes[0].Attachments=[{InstanceId:'i-0idle'}];
  }
  if(scenario==='incomplete'){
    copy.metrics['i-0idle'].cpuDailyPercent=[1,1];
    copy.metrics.idle.requestCountDaily=[];
  }
  if(scenario==='none'){
    copy.volumes.Volumes[0].State='in-use';copy.volumes.Volumes[0].Attachments=[{InstanceId:'i-0idle'}];
    copy.addresses.Addresses[0].AssociationId='eipassoc-sample';
    copy.metrics['i-0idle'].cpuDailyPercent=Array(14).fill(22);
    copy.metrics.idle.requestCountDaily=Array(14).fill(12);
    copy.snapshots.Snapshots[0].VolumeId='vol-0a11ce';
  }
  return copy;
}
