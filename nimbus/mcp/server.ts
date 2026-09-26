import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {createMcpExpressApp} from '@modelcontextprotocol/sdk/server/express.js';
import {z} from 'zod';
import {getInventory,getBilling,getDailyBilling,collectCostReviewEvidence,markVolumeForReview,deleteHackathonDemoVolume} from './aws-read.ts';

const textResult=(value:unknown)=>({content:[{type:'text' as const,text:JSON.stringify(value)}],structuredContent:value as Record<string,unknown>});
const errorResult=(label:string,e:unknown)=>({isError:true,content:[{type:'text' as const,text:`${label}: ${e instanceof Error?e.message:'unknown error'}`}]});
const inventoryOutput=z.object({source:z.string(),region:z.string(),accountId:z.string(),capturedAt:z.string(),counts:z.object({instances:z.number(),volumes:z.number(),addresses:z.number(),loadBalancers:z.number(),snapshots:z.number()}),coverage:z.record(z.string(),z.unknown()),resources:z.record(z.string(),z.unknown()),warning:z.string()});
const costOutput=z.object({source:z.string(),month:z.string(),services:z.array(z.object({service:z.string(),amount:z.string(),unit:z.string()})),coverage:z.object({maxPages:z.number(),truncated:z.boolean()}),warning:z.string()});
const dailyOutput=z.object({source:z.string(),startDate:z.string(),endDateExclusive:z.string(),days:z.number(),granularity:z.string(),services:z.array(z.object({date:z.string(),service:z.string(),amount:z.string(),unit:z.string()})),coverage:z.object({maxPages:z.number(),truncated:z.boolean()}),warning:z.string()});
const evidenceOutput=z.object({source:z.string(),capturedAt:z.string(),identity:z.object({accountId:z.string(),region:z.string()}),inventory:inventoryOutput,dailyCosts:dailyOutput,analysis:z.object({method:z.string(),dailyTotals:z.array(z.object({date:z.string(),amount:z.number()})),endpointDelta:z.object({firstDate:z.string(),lastDate:z.string(),firstAmount:z.number(),lastAmount:z.number(),absoluteChange:z.number(),percentChange:z.number().nullable()}).nullable(),topServiceChanges:z.array(z.object({service:z.string(),firstAmount:z.number(),lastAmount:z.number(),absoluteChange:z.number()})),limitation:z.string()}),baseline:z.object({status:z.enum(['first_run','insufficient_overlap','compared','storage_unavailable']),previousCapturedAt:z.string().nullable(),daysCompared:z.number(),changes:z.array(z.object({service:z.string(),unit:z.string(),previousAmount:z.number(),currentAmount:z.number(),change:z.number(),percentChange:z.number().nullable()})),note:z.string()})});

export function makeServer(){
 const server=new McpServer({name:'nimbus-aws-review',version:'0.1.0'});
 server.registerTool('collect_cost_review_evidence',{title:'Collect cost evidence and update baseline',description:'Preferred single-call Nimbus review. Reads AWS caller identity, paginated inventory, EC2 activity coverage, and daily Cost Explorer service totals; excludes the incomplete end date. It also stores a bounded local baseline snapshot per exact account and region, returning deterministic changes for overlapping complete dates. This writes only Nimbus local history; it makes no AWS resource changes. Service costs are not resource attribution, and changes are not anomaly or savings findings.',inputSchema:{region:z.string().optional(),days:z.number().int().min(7).max(31).optional()},outputSchema:evidenceOutput,annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:true}},async({region,days})=>{
  try{return textResult(await collectCostReviewEvidence(region,days??14));}
  catch(e){return errorResult('AWS evidence collection failed',e);}
 });
 server.registerTool('inspect_aws_inventory',{description:'Read the caller-configured AWS account inventory in one region and hourly CloudWatch CPU/network evidence for up to 100 EC2 instances over the last 14 complete UTC days. Missing or incomplete metrics are unknown, not zero; neither metrics nor account/service costs prove waste, resource-level cost, or safe deletion.',inputSchema:{region:z.string().optional()},outputSchema:inventoryOutput,annotations:{readOnlyHint:true}},async({region})=>{
  try{return textResult(await getInventory(region));}
  catch(e){return errorResult('AWS inventory lookup failed',e);}
 });
 server.registerTool('read_monthly_service_cost',{description:'Read service-level AWS Cost Explorer UnblendedCost for a month. Not a per-resource saving estimate.',inputSchema:{month:z.string().describe('YYYY-MM')},outputSchema:costOutput,annotations:{readOnlyHint:true}},async({month})=>{
  try{return textResult(await getBilling(month));}
  catch(e){return errorResult('AWS billing lookup failed',e);}
 });
 server.registerTool('read_recent_daily_service_cost',{description:'Read the last 7–31 UTC days of daily AWS Cost Explorer totals grouped by service. Data can be delayed and is not resource-level attribution.',inputSchema:{days:z.number().int().min(7).max(31).optional().describe('UTC day range; defaults to 14')},outputSchema:dailyOutput,annotations:{readOnlyHint:true}},async({days})=>{
  try{return textResult(await getDailyBilling(days??14));}
  catch(e){return errorResult('AWS daily cost lookup failed',e);}
 });
 server.registerTool('mark_volume_for_review',{
  description:'After TrueForge human approval, add the fixed reversible nimbus:review-state=candidate-for-human-review tag to one currently available, unattached EBS volume in the specified account and region. This is a review marker only; it does not authorize or perform deletion.',
  inputSchema:{region:z.string().describe('AWS region, e.g. us-east-1'),volumeId:z.string().describe('Exact EBS volume ID shown in the evidence'),expectedAccountId:z.string().describe('12-digit AWS account ID shown in the evidence')},
  outputSchema:z.object({source:z.string(),accountId:z.string(),region:z.string(),volumeId:z.string(),tag:z.object({key:z.string(),value:z.string()}),effect:z.string()}),
  annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:true}
 },async(input)=>{
  try{return textResult(await markVolumeForReview(input));}
  catch(e){return errorResult('AWS review tag was not applied',e);}
 });
 server.registerTool('delete_hackathon_demo_volume',{
  title:'Delete the configured hackathon demo volume',
  description:'DESTRUCTIVE and disabled by default. After TrueForge human approval, deletes only the one operator-configured, encrypted 1 GiB gp3 volume tagged nimbus:hackathon-demo=agents-that-act-disposable and nimbus:dispose-after-approval=true. The server rechecks the exact configured account, region, volume ID, volume tags, available state, and zero attachments immediately before deletion. Requires NIMBUS_ENABLE_DISPOSABLE_VOLUME_DELETE=true plus a single exact target configured in the Nimbus MCP server environment. Never use for production or for any resource other than that disposable demo target. Scheduled runs must never call this tool.',
  inputSchema:{region:z.string().describe('Exact configured demo volume region'),volumeId:z.string().describe('Exact configured disposable volume ID shown in the evidence'),expectedAccountId:z.string().describe('12-digit account ID shown in the evidence')},
  outputSchema:z.object({source:z.string(),accountId:z.string(),region:z.string(),volumeId:z.string(),effect:z.string()}),
  annotations:{readOnlyHint:false,destructiveHint:true,idempotentHint:false,openWorldHint:true}
 },async(input)=>{
  try{return textResult(await deleteHackathonDemoVolume(input));}
  catch(e){return errorResult('Disposable AWS demo volume was not deleted',e);}
 });
 return server;
}
export function listTools(){
 return [
  {name:'collect_cost_review_evidence',annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:true}},
  {name:'inspect_aws_inventory',annotations:{readOnlyHint:true}},
  {name:'read_monthly_service_cost',annotations:{readOnlyHint:true}},
  {name:'read_recent_daily_service_cost',annotations:{readOnlyHint:true}},
  {name:'mark_volume_for_review',annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:true}},
  {name:'delete_hackathon_demo_volume',annotations:{readOnlyHint:false,destructiveHint:true,idempotentHint:false,openWorldHint:true}}
 ] as const;
}
export function start(port=8792,host='127.0.0.1'){
 const app=createMcpExpressApp({host});
 app.post('/mcp',async(req,res)=>{
  const server=makeServer();const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
  try{await server.connect(transport);await transport.handleRequest(req,res,req.body);}catch(e){console.error('MCP error',e);if(!res.headersSent)res.status(500).json({jsonrpc:'2.0',error:{code:-32603,message:'Internal error'},id:null});}
  res.on('close',()=>{transport.close();server.close()});
 });
 app.get('/mcp',(_req,res)=>res.status(405).send('Method not allowed'));
 const listener=app.listen(port,host,()=>{if(process.env.NODE_ENV!=='test')console.log(`Nimbus AWS review MCP listening at http://${host}:${port}/mcp`)});
 return listener;
}
if(process.argv[1] && import.meta.url===new URL(`file://${process.argv[1]}`).href)start(Number(process.env.NIMBUS_MCP_PORT||8792));
