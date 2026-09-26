import test from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {listTools,makeServer} from './server.ts';
import {analyzeDailyCosts,compareCostBaselines} from './cost-analysis.ts';
import {assertDisposableDemoVolume,collectPages,deleteHackathonDemoVolume} from './aws-read.ts';

test('MCP server exposes evidence readers, one reversible review write, and one opt-in disposable delete tool',async()=>{
 const server=makeServer();
 const client=new Client({name:'nimbus-test',version:'0.1.0'});
 const [clientTransport,serverTransport]=InMemoryTransport.createLinkedPair();
 await server.connect(serverTransport);
 await client.connect(clientTransport);
 const {tools}=await client.listTools();
 const names=tools.map(x=>x.name).sort();
 assert.deepEqual(names,['collect_cost_review_evidence','delete_hackathon_demo_volume','inspect_aws_inventory','mark_volume_for_review','read_monthly_service_cost','read_recent_daily_service_cost']);
 assert.equal(tools.find(x=>x.name==='collect_cost_review_evidence')?.annotations?.readOnlyHint,false);
 assert.match(tools.find(x=>x.name==='collect_cost_review_evidence')?.description||'',/local history.*no AWS resource changes/i);
 assert.ok(tools.find(x=>x.name==='collect_cost_review_evidence')?.outputSchema);
 assert.equal(tools.find(x=>x.name==='inspect_aws_inventory')?.annotations?.readOnlyHint,true);
 assert.equal(tools.find(x=>x.name==='read_monthly_service_cost')?.annotations?.readOnlyHint,true);
 assert.equal(tools.find(x=>x.name==='read_recent_daily_service_cost')?.annotations?.readOnlyHint,true);
 const write=tools.find(x=>x.name==='mark_volume_for_review');
 assert.equal(write?.annotations?.readOnlyHint,false);
 assert.equal(write?.annotations?.destructiveHint,false);
 assert.match(write?.description||'',/reversible.*review marker/i);
 const destructive=tools.find(x=>x.name==='delete_hackathon_demo_volume');
 assert.equal(destructive?.annotations?.readOnlyHint,false);
 assert.equal(destructive?.annotations?.destructiveHint,true);
 assert.match(destructive?.description||'',/disabled by default.*operator-configured.*available state.*zero attachments/i);
 await client.close();
 await server.close();
});

test('tool metadata helper matches the MCP server local-write and AWS-write safety boundary',()=>{
 const tools=listTools();
 assert.equal(tools.find(tool=>tool.name==='collect_cost_review_evidence')?.annotations.readOnlyHint,false);
 assert.equal(tools.find(tool=>tool.name==='mark_volume_for_review')?.annotations.readOnlyHint,false);
 assert.equal(tools.find(tool=>tool.name==='delete_hackathon_demo_volume')?.annotations.destructiveHint,true);
 assert.equal(tools.filter(tool=>tool.annotations.readOnlyHint===false).length,3);
});

test('disposable volume deletion is closed unless the operator explicitly enables it',async()=>{
 const previous=process.env.NIMBUS_ENABLE_DISPOSABLE_VOLUME_DELETE;
 delete process.env.NIMBUS_ENABLE_DISPOSABLE_VOLUME_DELETE;
 try{
  await assert.rejects(deleteHackathonDemoVolume({region:'us-east-1',volumeId:'vol-0123456789abcdef0',expectedAccountId:'123456789012'}),/disabled/);
 }finally{
  if(previous===undefined)delete process.env.NIMBUS_ENABLE_DISPOSABLE_VOLUME_DELETE;
  else process.env.NIMBUS_ENABLE_DISPOSABLE_VOLUME_DELETE=previous;
 }
});

test('disposable volume deletion requires an exact operator-configured target before AWS access',async()=>{
 const previous={enabled:process.env.NIMBUS_ENABLE_DISPOSABLE_VOLUME_DELETE,region:process.env.NIMBUS_DISPOSABLE_VOLUME_REGION,volume:process.env.NIMBUS_DISPOSABLE_VOLUME_ID,account:process.env.NIMBUS_DISPOSABLE_VOLUME_ACCOUNT_ID};
 process.env.NIMBUS_ENABLE_DISPOSABLE_VOLUME_DELETE='true';
 delete process.env.NIMBUS_DISPOSABLE_VOLUME_REGION;
 delete process.env.NIMBUS_DISPOSABLE_VOLUME_ID;
 delete process.env.NIMBUS_DISPOSABLE_VOLUME_ACCOUNT_ID;
 try{
  await assert.rejects(deleteHackathonDemoVolume({region:'us-east-1',volumeId:'vol-0123456789abcdef0',expectedAccountId:'123456789012'}),/single exact account, region, and volume ID/);
 }finally{
  if(previous.enabled===undefined)delete process.env.NIMBUS_ENABLE_DISPOSABLE_VOLUME_DELETE;else process.env.NIMBUS_ENABLE_DISPOSABLE_VOLUME_DELETE=previous.enabled;
  if(previous.region===undefined)delete process.env.NIMBUS_DISPOSABLE_VOLUME_REGION;else process.env.NIMBUS_DISPOSABLE_VOLUME_REGION=previous.region;
  if(previous.volume===undefined)delete process.env.NIMBUS_DISPOSABLE_VOLUME_ID;else process.env.NIMBUS_DISPOSABLE_VOLUME_ID=previous.volume;
  if(previous.account===undefined)delete process.env.NIMBUS_DISPOSABLE_VOLUME_ACCOUNT_ID;else process.env.NIMBUS_DISPOSABLE_VOLUME_ACCOUNT_ID=previous.account;
 }
});

test('disposable volume gate accepts only the exact encrypted one-GiB unattached demo target',()=>{
 const safe={VolumeId:'vol-0123456789abcdef0',State:'available',Attachments:[],Tags:[{Key:'nimbus:hackathon-demo',Value:'agents-that-act-disposable'},{Key:'nimbus:dispose-after-approval',Value:'true'}],VolumeType:'gp3',Size:1,Encrypted:true};
 assert.doesNotThrow(()=>assertDisposableDemoVolume(safe,safe.VolumeId));
 assert.throws(()=>assertDisposableDemoVolume({...safe,VolumeId:'vol-fffffffffffffffff'},safe.VolumeId),/does not match/);
 assert.throws(()=>assertDisposableDemoVolume({...safe,Tags:[]},safe.VolumeId),/missing the exact/);
 assert.throws(()=>assertDisposableDemoVolume({...safe,Attachments:[{InstanceId:'i-demo'}]},safe.VolumeId),/available and unattached/);
 assert.throws(()=>assertDisposableDemoVolume({...safe,State:'in-use'},safe.VolumeId),/available and unattached/);
 assert.throws(()=>assertDisposableDemoVolume({...safe,VolumeType:'gp2'},safe.VolumeId),/encrypted 1 GiB gp3/);
 assert.throws(()=>assertDisposableDemoVolume({...safe,Size:2},safe.VolumeId),/encrypted 1 GiB gp3/);
 assert.throws(()=>assertDisposableDemoVolume({...safe,Encrypted:false},safe.VolumeId),/encrypted 1 GiB gp3/);
});

test('daily cost analysis excludes incomplete end date and computes deterministic service changes',()=>{
 const result=analyzeDailyCosts([{date:'2026-09-01',service:'EC2',amount:'2',unit:'USD'},{date:'2026-09-02',service:'EC2',amount:'3',unit:'USD'},{date:'2026-09-03',service:'EC2',amount:'100',unit:'USD'}],'2026-09-03');
 assert.equal(result.endpointDelta?.firstAmount,2);
 assert.equal(result.endpointDelta?.lastAmount,3);
 assert.equal(result.topServiceChanges[0]?.absoluteChange,1);
});

test('daily cost analysis withholds percentage changes for a non-positive baseline',()=>{
 const result=analyzeDailyCosts([{date:'2026-09-01',service:'Credits',amount:'-2',unit:'USD'},{date:'2026-09-02',service:'Credits',amount:'-3',unit:'USD'}],'2026-09-03');
 assert.equal(result.endpointDelta?.absoluteChange,-1);
 assert.equal(result.endpointDelta?.percentChange,null);
});

test('cross-run baseline compares only shared complete dates for the same account and region',()=>{
 const services=(start:number,end:number,factor=1)=>Array.from({length:end-start},(_,offset)=>({date:`2026-09-${String(start+offset).padStart(2,'0')}`,service:'EC2',amount:String((start+offset)*factor),unit:'USD'}));
 const previous={accountId:'123456789012',region:'us-east-1',capturedAt:'2026-09-15T00:00:00.000Z',startDate:'2026-09-01',endDateExclusive:'2026-09-15',services:services(1,15)};
 const current={...previous,capturedAt:'2026-09-16T00:00:00.000Z',startDate:'2026-09-02',endDateExclusive:'2026-09-16',services:services(2,16,2)};
 const result=compareCostBaselines(previous,current);
 assert.equal(result.status,'compared');assert.equal(result.daysCompared,13);assert.equal(result.changes[0]?.previousAmount,104);assert.equal(result.changes[0]?.currentAmount,208);assert.equal(result.changes[0]?.percentChange,100);
 assert.equal(compareCostBaselines(null,current).status,'first_run');
 assert.throws(()=>compareCostBaselines(previous,{...current,region:'us-west-2'}),/same AWS account and region/);
});

test('paginated collector follows continuation tokens and returns accumulated items',async()=>{
 const requests:Array<string|undefined>=[];
 const result=await collectPages(async token=>{requests.push(token);return token?{items:[3,4]}:{items:[1,2],token:'next'};},3);
 assert.deepEqual(requests,[undefined,'next']);
 assert.deepEqual(result,{items:[1,2,3,4],truncated:false});
});

test('paginated collector reports when the safety page cap is reached',async()=>{
 const requests:Array<string|undefined>=[];
 const result=await collectPages(async token=>{requests.push(token);return {items:[requests.length],token:`page-${requests.length}`};},2);
 assert.deepEqual(requests,[undefined,'page-1']);
 assert.deepEqual(result,{items:[1,2],truncated:true});
});
