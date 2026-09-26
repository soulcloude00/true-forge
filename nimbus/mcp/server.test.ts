import test from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {makeServer} from './server.ts';
import {collectPages} from './aws-read.ts';

test('MCP server exposes read-only evidence tools and one bounded review-write tool',async()=>{
 const server=makeServer();
 const client=new Client({name:'nimbus-test',version:'0.1.0'});
 const [clientTransport,serverTransport]=InMemoryTransport.createLinkedPair();
 await server.connect(serverTransport);
 await client.connect(clientTransport);
 const {tools}=await client.listTools();
 const names=tools.map(x=>x.name).sort();
 assert.deepEqual(names,['inspect_aws_inventory','mark_volume_for_review','read_monthly_service_cost','read_recent_daily_service_cost']);
 assert.equal(tools.find(x=>x.name==='inspect_aws_inventory')?.annotations?.readOnlyHint,true);
 assert.equal(tools.find(x=>x.name==='read_monthly_service_cost')?.annotations?.readOnlyHint,true);
 assert.equal(tools.find(x=>x.name==='read_recent_daily_service_cost')?.annotations?.readOnlyHint,true);
 const write=tools.find(x=>x.name==='mark_volume_for_review');
 assert.equal(write?.annotations?.readOnlyHint,false);
 assert.equal(write?.annotations?.destructiveHint,false);
 assert.match(write?.description||'',/reversible.*review marker/i);
 await client.close();
 await server.close();
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
