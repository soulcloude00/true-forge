export type DailyCostRow={date:string;service:string;amount:string;unit:string};

export function analyzeDailyCosts(rows:DailyCostRow[],endDateExclusive:string){
 const totalsByDate=new Map<string,number>();
 for(const row of rows){const amount=Number(row.amount);if(Number.isFinite(amount))totalsByDate.set(row.date,(totalsByDate.get(row.date)||0)+amount);}
 const dailyTotals=[...totalsByDate].sort(([left],[right])=>left.localeCompare(right)).map(([date,amount])=>({date,amount}));
 const completeDates=dailyTotals.filter(({date})=>date<endDateExclusive);
 const first=completeDates[0],last=completeDates.at(-1);
 const endpointDelta=first&&last&&first.amount!==0?{firstDate:first.date,lastDate:last.date,firstAmount:first.amount,lastAmount:last.amount,absoluteChange:last.amount-first.amount,percentChange:((last.amount-first.amount)/Math.abs(first.amount))*100}:null;
 const byService=new Map<string,{first:number;last:number}>();
 for(const row of rows){
  const amount=Number(row.amount);if(!Number.isFinite(amount))continue;
  const bounds=byService.get(row.service)||{first:0,last:0};
  if(first&&row.date===first.date)bounds.first+=amount;
  if(last&&row.date===last.date)bounds.last+=amount;
  byService.set(row.service,bounds);
 }
 const topServiceChanges=[...byService].map(([service,amounts])=>({service,firstAmount:amounts.first,lastAmount:amounts.last,absoluteChange:amounts.last-amounts.first})).sort((left,right)=>Math.abs(right.absoluteChange)-Math.abs(left.absoluteChange)).slice(0,10);
 return {method:'deterministic account/service totals; excludes the Cost Explorer end date because it is incomplete',dailyTotals,endpointDelta,topServiceChanges,limitation:'These account/service-level totals cannot be attributed to resources and do not establish waste or savings.'};
}
