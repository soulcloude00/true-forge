import {scan,type Inventory} from './scanner.ts';
/** Reprices the same input rules only; not live prices, rate forecasts or billing data. */
export function rateSensitivity(i:Inventory,multiplier:number){
 if(!Number.isFinite(multiplier)||multiplier<0||multiplier>3)throw Error('Rate multiplier must be between 0 and 3.');
 const base=scan(i),priced=scan({...i,rates:Object.fromEntries(Object.entries(i.rates).map(([key,value])=>[key,value*multiplier])) as Inventory['rates']});
 const sum=(rows:typeof base)=>Math.round(rows.reduce((n,f)=>n+f.estimatedMonthlyUsd,0)*100)/100;
 return {baseCount:base.length,scenarioCount:priced.length,baseMonthlyUsd:sum(base),scenarioMonthlyUsd:sum(priced),deltaMonthlyUsd:Math.round((sum(priced)-sum(base))*100)/100};
}
