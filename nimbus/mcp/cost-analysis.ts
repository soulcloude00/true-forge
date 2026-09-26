export type DailyCostRow={date:string;service:string;amount:string;unit:string};
export type CostBaselineSnapshot={accountId:string;region:string;capturedAt:string;startDate:string;endDateExclusive:string;services:DailyCostRow[]};

export function compareCostBaselines(previous:CostBaselineSnapshot|null,current:CostBaselineSnapshot,minimumSharedDays=7){
 if(!Number.isInteger(minimumSharedDays)||minimumSharedDays<1||minimumSharedDays>31)throw new Error('minimumSharedDays must be between 1 and 31.');
 if(!previous)return {status:'first_run' as const,previousCapturedAt:null,daysCompared:0,changes:[],note:'No earlier Nimbus baseline exists for this exact AWS account and region. This run establishes the first local baseline.'};
 if(previous.accountId!==current.accountId||previous.region!==current.region)throw new Error('Cost baselines must use the same AWS account and region.');
 const previousDates=new Set(previous.services.map(row=>row.date)),currentDates=new Set(current.services.map(row=>row.date));
 const sharedDates=[...previousDates].filter(date=>currentDates.has(date)&&date<previous.endDateExclusive&&date<current.endDateExclusive).sort();
 if(sharedDates.length<minimumSharedDays)return {status:'insufficient_overlap' as const,previousCapturedAt:previous.capturedAt,daysCompared:sharedDates.length,changes:[],note:`Only ${sharedDates.length} complete UTC dates overlap; at least ${minimumSharedDays} are required for a run-to-run comparison.`};
 const shared=new Set(sharedDates),sumByService=(rows:DailyCostRow[])=>{
  const totals=new Map<string,number>();
  for(const row of rows){if(!shared.has(row.date))continue;const amount=Number(row.amount);if(!Number.isFinite(amount))continue;const key=`${row.service}\u0000${row.unit}`;totals.set(key,(totals.get(key)||0)+amount)}
  return totals;
 };
 const before=sumByService(previous.services),after=sumByService(current.services);
 const changes=[...new Set([...before.keys(),...after.keys()])].map(key=>{
  const [service,unit]=key.split('\u0000'),previousAmount=before.get(key)||0,currentAmount=after.get(key)||0,change=currentAmount-previousAmount;
  return {service,unit,previousAmount,currentAmount,change,percentChange:previousAmount>0?change/previousAmount*100:null};
 }).sort((left,right)=>Math.abs(right.change)-Math.abs(left.change));
 return {status:'compared' as const,previousCapturedAt:previous.capturedAt,daysCompared:sharedDates.length,changes,note:'Deterministic changes in overlapping, complete UTC dates for account/service totals. Cost Explorer data can be revised or delayed; this is not an anomaly verdict, resource attribution, savings, or waste finding.'};
}

export function analyzeDailyCosts(rows:DailyCostRow[],endDateExclusive:string){
 const totalsByDate=new Map<string,number>();
 for(const row of rows){const amount=Number(row.amount);if(Number.isFinite(amount))totalsByDate.set(row.date,(totalsByDate.get(row.date)||0)+amount);}
 const dailyTotals=[...totalsByDate].sort(([left],[right])=>left.localeCompare(right)).map(([date,amount])=>({date,amount}));
 const completeDates=dailyTotals.filter(({date})=>date<endDateExclusive);
 const first=completeDates[0],last=completeDates.at(-1);
 const endpointDelta=first&&last?{firstDate:first.date,lastDate:last.date,firstAmount:first.amount,lastAmount:last.amount,absoluteChange:last.amount-first.amount,percentChange:first.amount>0?((last.amount-first.amount)/first.amount)*100:null}:null;
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
