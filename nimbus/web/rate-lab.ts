import {scan,type Inventory} from './scanner.ts';
export type RateKey=keyof Inventory['rates'];
const round=(n:number)=>Math.round(n*100)/100;
/** Local one-rate what-if; no pricing API, bills, or change to saved review. */
export function rateLab(i:Inventory,key:RateKey,value:number){
 if(!Object.hasOwn(i.rates,key)||!Number.isFinite(value)||value<0||value>1_000_000)throw Error('Enter a finite nonnegative input rate.');
 const original=scan(i),alternative=scan({...i,rates:{...i.rates,[key]:value}});
 const prior=new Map(original.map(f=>[f.id,f]));
 const rows=alternative.map(f=>({resourceId:f.resourceId,kind:f.kind,originalUsd:prior.get(f.id)?.estimatedMonthlyUsd??0,alternativeUsd:f.estimatedMonthlyUsd,deltaUsd:round(f.estimatedMonthlyUsd-(prior.get(f.id)?.estimatedMonthlyUsd??0))}));
 const total=(items:typeof original)=>round(items.reduce((n,f)=>n+f.estimatedMonthlyUsd,0));
 return {originalUsd:total(original),alternativeUsd:total(alternative),deltaUsd:round(total(alternative)-total(original)),rows:rows.filter(r=>r.deltaUsd!==0)};
}
