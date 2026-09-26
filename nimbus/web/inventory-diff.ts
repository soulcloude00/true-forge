import {scan,type Inventory, type Finding} from './scanner.ts';
export type InventoryDiff={previousCount:number;currentCount:number;added:Finding[];cleared:Finding[];shared:Finding[];previousMonthlyUsd:number;currentMonthlyUsd:number;differenceMonthlyUsd:number};
/** Compare local scanner outputs, not billing history or realized savings. */
export function inventoryDiff(previous:Inventory,current:Inventory):InventoryDiff{
 if(previous.region!==current.region)throw Error('Regions differ; compare inventories from the same stated region.');
 if(previous.accountId!==current.accountId)throw Error('Account labels differ or are missing in one input; compare inventories from the same stated account.');
 const before=scan(previous),after=scan(current);
 const b=new Map(before.map(f=>[f.id,f])),a=new Map(after.map(f=>[f.id,f]));
 const sum=(f:Finding[])=>Math.round(f.reduce((n,x)=>n+x.estimatedMonthlyUsd,0)*100)/100;
 const previousMonthlyUsd=sum(before),currentMonthlyUsd=sum(after);
 return {previousCount:before.length,currentCount:after.length,added:after.filter(f=>!b.has(f.id)),cleared:before.filter(f=>!a.has(f.id)),shared:after.filter(f=>b.has(f.id)),previousMonthlyUsd,currentMonthlyUsd,differenceMonthlyUsd:Math.round((currentMonthlyUsd-previousMonthlyUsd)*100)/100};
}
/** A small shareable JSON handoff of the comparison, excluding raw inventory. */
export function inventoryDiffReport(previous:Inventory,current:Inventory):string{
 const d=inventoryDiff(previous,current);
 return JSON.stringify({kind:'Nimbus local inventory comparison',provenance:'Two locally supplied AWS-shaped inputs, unverified; no AWS or billing connection',reference:{accountLabel:previous.accountId||null,region:previous.region,capturedAt:previous.capturedAt,leadCount:d.previousCount,roughCandidateMonthlyUsd:d.previousMonthlyUsd},current:{accountLabel:current.accountId||null,region:current.region,capturedAt:current.capturedAt,leadCount:d.currentCount,roughCandidateMonthlyUsd:d.currentMonthlyUsd},differenceMonthlyUsd:d.differenceMonthlyUsd,caveat:'A change in scan leads or estimate is not a measured bill change, deletion or realized savings. Inputs may use different rates.',addedIds:d.added.map(f=>f.resourceId),noLongerFlaggedIds:d.cleared.map(f=>f.resourceId),stillFlaggedIds:d.shared.map(f=>f.resourceId)},null,2);
}
