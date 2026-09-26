import test from 'node:test';
import assert from 'node:assert/strict';
import {chmod,mkdtemp,readFile,rm,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {recordCostBaseline} from './cost-baseline-store.ts';
import type {CostBaselineSnapshot} from './cost-analysis.ts';

function snapshot(accountId:string,capturedAt:string):CostBaselineSnapshot{
 return {accountId,region:'us-east-1',capturedAt,startDate:'2026-09-01',endDateExclusive:'2026-09-15',services:[]};
}

test('baseline history has a global cap and keeps the newest snapshot',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'nimbus-baseline-cap-'));
 try{
  const path=join(directory,'history.json');
  const existing=Array.from({length:1001},(_,index)=>snapshot(String(100000000000+index),new Date(Date.UTC(2020,0,index+1)).toISOString()));
  await writeFile(path,JSON.stringify(existing));
  const latest=snapshot('999999999999','2099-01-01T00:00:00.000Z');
  await recordCostBaseline(latest,path);
  const saved=JSON.parse(await readFile(path,'utf8')) as CostBaselineSnapshot[];
  assert.equal(saved.length,1000);
  assert.equal(saved[0]?.capturedAt,latest.capturedAt);
  assert.ok(saved.some(item=>item.accountId===latest.accountId));
 }finally{
  await rm(directory,{recursive:true,force:true});
 }
});

test('baseline writes replace permissive file modes with private permissions',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'nimbus-baseline-mode-'));
 try{
  const path=join(directory,'history.json');
  await chmod(directory,0o755);
  await writeFile(path,'[]',{mode:0o644});
  await chmod(path,0o644);
  await recordCostBaseline(snapshot('123456789012','2026-09-26T00:00:00.000Z'),path);
  const info=await stat(path);
  assert.equal(info.mode&0o777,0o600);
 }finally{
  await rm(directory,{recursive:true,force:true});
 }
});
