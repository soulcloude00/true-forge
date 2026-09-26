import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {createMcpExpressApp} from '@modelcontextprotocol/sdk/server/express.js';
import {z} from 'zod';
import {getInventory,getBilling,getDailyBilling,markVolumeForReview} from './aws-read.ts';

export function makeServer(){
 const server=new McpServer({name:'nimbus-aws-review',version:'0.1.0'});
 server.registerTool('inspect_aws_inventory',{description:'Read the caller-configured AWS account inventory in one region. First 100 records per paginated service; no utilization or deletion claims.',inputSchema:{region:z.string().optional()},annotations:{readOnlyHint:true}},async({region})=>{
  try{return {content:[{type:'text' as const,text:JSON.stringify(await getInventory(region))}]};}
  catch(e){return {isError:true,content:[{type:'text' as const,text:`AWS inventory lookup failed: ${e instanceof Error?e.message:'unknown error'}`}]};}
 });
 server.registerTool('read_monthly_service_cost',{description:'Read service-level AWS Cost Explorer UnblendedCost for a month. Not a per-resource saving estimate.',inputSchema:{month:z.string().describe('YYYY-MM')},annotations:{readOnlyHint:true}},async({month})=>{
  try{return {content:[{type:'text' as const,text:JSON.stringify(await getBilling(month))}]};}
  catch(e){return {isError:true,content:[{type:'text' as const,text:`AWS billing lookup failed: ${e instanceof Error?e.message:'unknown error'}`}]};}
 });
 server.registerTool('read_recent_daily_service_cost',{description:'Read the last 7–31 UTC days of daily AWS Cost Explorer totals grouped by service. Data can be delayed and is not resource-level attribution.',inputSchema:{days:z.number().int().min(7).max(31).optional().describe('UTC day range; defaults to 14')},annotations:{readOnlyHint:true}},async({days})=>{
  try{return {content:[{type:'text' as const,text:JSON.stringify(await getDailyBilling(days??14))}]};}
  catch(e){return {isError:true,content:[{type:'text' as const,text:`AWS daily cost lookup failed: ${e instanceof Error?e.message:'unknown error'}`}]};}
 });
 server.registerTool('mark_volume_for_review',{
  description:'After TrueForge human approval, add the fixed reversible nimbus:review-state=candidate-for-human-review tag to one currently available, unattached EBS volume in the specified account and region. This is a review marker only; it does not authorize or perform deletion.',
  inputSchema:{region:z.string().describe('AWS region, e.g. us-east-1'),volumeId:z.string().describe('Exact EBS volume ID shown in the evidence'),expectedAccountId:z.string().describe('12-digit AWS account ID shown in the evidence')},
  annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:true}
 },async(input)=>{
  try{return {content:[{type:'text' as const,text:JSON.stringify(await markVolumeForReview(input))}]};}
  catch(e){return {isError:true,content:[{type:'text' as const,text:`AWS review tag was not applied: ${e instanceof Error?e.message:'unknown error'}`}]};}
 });
 return server;
}
export function listTools(){
 return [
  {name:'inspect_aws_inventory',annotations:{readOnlyHint:true}},
  {name:'read_monthly_service_cost',annotations:{readOnlyHint:true}},
  {name:'read_recent_daily_service_cost',annotations:{readOnlyHint:true}},
  {name:'mark_volume_for_review',annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:true}}
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
