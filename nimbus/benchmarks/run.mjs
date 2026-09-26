import {performance} from 'node:perf_hooks';
import {analyzeDailyCosts} from '../mcp/cost-analysis.ts';

const rounds=1000;
const dates=Array.from({length:14},(_,index)=>`2026-09-${String(index+1).padStart(2,'0')}`);
const fixture=dates.flatMap((date,day)=>['Amazon EC2','Amazon S3','Amazon CloudWatch'].map((service,index)=>({date,service,amount:String((day+1)*(index+1)*0.0137),unit:'USD'})));
for(let index=0;index<100;index++)analyzeDailyCosts(fixture,'2026-09-15');
const times=[];
for(let index=0;index<rounds;index++){const start=performance.now();const output=analyzeDailyCosts(fixture,'2026-09-15');times.push(performance.now()-start);if(output.dailyTotals.length!==14||output.topServiceChanges.length!==3)throw new Error('Benchmark correctness assertion failed');}
times.sort((a,b)=>a-b);
const percentile=value=>times[Math.ceil(value*times.length)-1];
console.log(JSON.stringify({benchmark:'Nimbus deterministic daily/service aggregation',fixtureRows:fixture.length,iterations:rounds,medianMs:Number(percentile(0.5).toFixed(4)),p95Ms:Number(percentile(0.95).toFixed(4)),maxMs:Number(times.at(-1).toFixed(4)),correctness:'14 daily totals and 3 service totals verified',note:'Synthetic local microbenchmark; excludes network, AWS, sandbox, and model latency.'},null,2));
