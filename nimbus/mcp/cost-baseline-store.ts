import {homedir} from 'node:os';
import {dirname,join} from 'node:path';
import {chmod,mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import type {CostBaselineSnapshot} from './cost-analysis.ts';

const MAX_SNAPSHOTS_PER_SCOPE=90;
const MAX_SNAPSHOTS_TOTAL=1000;
let writeQueue:Promise<void>=Promise.resolve();

function dataPath(){return process.env.NIMBUS_COST_BASELINE_FILE||join(homedir(),'.nimbus-cost-agent','cost-baselines.json')}
function validSnapshot(value:unknown):value is CostBaselineSnapshot{
 if(!value||typeof value!=='object')return false;
 const snapshot=value as Partial<CostBaselineSnapshot>;
 return typeof snapshot.accountId==='string'&&/^\d{12}$/.test(snapshot.accountId)&&typeof snapshot.region==='string'&&typeof snapshot.capturedAt==='string'&&typeof snapshot.startDate==='string'&&typeof snapshot.endDateExclusive==='string'&&Array.isArray(snapshot.services)&&snapshot.services.every(row=>row&&typeof row.date==='string'&&typeof row.service==='string'&&typeof row.amount==='string'&&typeof row.unit==='string');
}
async function readAll(path:string):Promise<CostBaselineSnapshot[]>{
 try{
  const parsed=JSON.parse(await readFile(path,'utf8')) as unknown;
  if(!Array.isArray(parsed))throw new Error('Baseline file must contain a JSON array.');
  if(!parsed.every(validSnapshot))throw new Error('Baseline file contains an invalid cost snapshot.');
  return parsed;
 }catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return [];throw error}
}

export async function recordCostBaseline(snapshot:CostBaselineSnapshot,path=dataPath()):Promise<{previous:CostBaselineSnapshot|null;retainedSnapshots:number}>{
 const operation=writeQueue.then(async()=>{
  const all=await readAll(path);
  const sameScope=all.filter(item=>item.accountId===snapshot.accountId&&item.region===snapshot.region).sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt));
  const previous=sameScope[0]??null;
  const retained=[snapshot,...sameScope.filter(item=>item.capturedAt!==snapshot.capturedAt)].sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt)).slice(0,MAX_SNAPSHOTS_PER_SCOPE);
  const otherScopes=all.filter(item=>item.accountId!==snapshot.accountId||item.region!==snapshot.region);
  const output=[...otherScopes,...retained].sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt)).slice(0,MAX_SNAPSHOTS_TOTAL);
  await mkdir(dirname(path),{recursive:true,mode:0o700});
  const temporary=`${path}.${process.pid}.tmp`;
  await writeFile(temporary,JSON.stringify(output),{encoding:'utf8',mode:0o600});
  await chmod(temporary,0o600);
  await rename(temporary,path);
  return {previous,retainedSnapshots:retained.length};
 });
 writeQueue=operation.then(()=>undefined,()=>undefined);
 return operation;
}
