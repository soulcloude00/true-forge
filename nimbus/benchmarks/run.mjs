import {performance} from 'node:perf_hooks';
import {analyzeDailyCosts,compareCostBaselines} from '../mcp/cost-analysis.ts';

const rounds=1000;
const dates=Array.from({length:14},(_,index)=>`2026-09-${String(index+1).padStart(2,'0')}`);
const fixture=dates.flatMap((date,day)=>['Amazon EC2','Amazon S3','Amazon CloudWatch'].map((service,index)=>({date,service,amount:String((day+1)*(index+1)*0.0137),unit:'USD'})));
const baseline={accountId:'000000000000',region:'us-east-1',capturedAt:'2026-09-15T00:00:00.000Z',startDate:'2026-09-01',endDateExclusive:'2026-09-15',services:fixture};
const current={...baseline,capturedAt:'2026-09-16T00:00:00.000Z',services:fixture.map(row=>({...row,amount:String(Number(row.amount)*1.1)}))};
for(let index=0;index<100;index++)analyzeDailyCosts(fixture,'2026-09-15');
const aggregateTimes=[],baselineTimes=[];
for(let index=0;index<rounds;index++){
 let start=performance.now();const output=analyzeDailyCosts(fixture,'2026-09-15');aggregateTimes.push(performance.now()-start);
 if(output.dailyTotals.length!==14||output.topServiceChanges.length!==3)throw new Error('Aggregation benchmark correctness assertion failed');
 start=performance.now();const comparison=compareCostBaselines(baseline,current);baselineTimes.push(performance.now()-start);
 if(comparison.status!=='compared'||comparison.daysCompared!==14||comparison.changes.length!==3||comparison.changes.some(change=>change.percentChange===null||Math.abs(change.percentChange-10)>1e-8))throw new Error('Baseline comparison benchmark correctness assertion failed');
}
const stats=times=>{times.sort((a,b)=>a-b);const percentile=value=>times[Math.ceil(value*times.length)-1];return {medianMs:Number(percentile(0.5).toFixed(4)),p95Ms:Number(percentile(0.95).toFixed(4)),maxMs:Number(times.at(-1).toFixed(4))}};
console.log(JSON.stringify({benchmark:'Nimbus deterministic cost analysis and persistent-baseline comparison',fixtureRows:fixture.length,iterations:rounds,analysis:stats(aggregateTimes),baselineComparison:stats(baselineTimes),correctness:'14 daily totals, 3 service totals, and 14-overlap/3-service baseline deltas verified',note:'Synthetic local microbenchmarks; exclude AWS, filesystem, network, TrueForge, sandbox, and model latency.'},null,2));
