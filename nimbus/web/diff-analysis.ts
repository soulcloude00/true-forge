import {inventoryDiff} from './inventory-diff.ts';
import type {Inventory} from './scanner.ts';
const round=(n:number)=>Math.round(n*100)/100;
/** Local lead-estimate reconciliation, never proof of billing change. */
export function diffAnalysis(reference:Inventory,current:Inventory){
 const diff=inventoryDiff(reference,current);
 const ref=inventoryDiff(reference,reference).shared;
 const lookup=new Map(ref.map(f=>[f.id,f]));
 const addedUsd=round(diff.added.reduce((n,f)=>n+f.estimatedMonthlyUsd,0));
 const clearedUsd=round(diff.cleared.reduce((n,f)=>n+f.estimatedMonthlyUsd,0));
 const ongoing=diff.shared.map(f=>({id:f.resourceId,referenceUsd:lookup.get(f.id)!.estimatedMonthlyUsd,currentUsd:f.estimatedMonthlyUsd,deltaUsd:round(f.estimatedMonthlyUsd-lookup.get(f.id)!.estimatedMonthlyUsd)}));
 const continuingDeltaUsd=round(ongoing.reduce((n,f)=>n+f.deltaUsd,0));
 const rateChanges=Object.keys(reference.rates).filter(k=>reference.rates[k as keyof typeof reference.rates]!==current.rates[k as keyof typeof current.rates]);
 const referenceTime=Date.parse(reference.capturedAt),currentTime=Date.parse(current.capturedAt);
 return {addedUsd,clearedUsd,continuingDeltaUsd,ongoing,rateChanges,chronology:currentTime===referenceTime?'same':currentTime>referenceTime?'later':'earlier',reconciledDeltaUsd:round(addedUsd-clearedUsd+continuingDeltaUsd),reportedDeltaUsd:diff.differenceMonthlyUsd};
}
