import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {createMcpExpressApp} from '@modelcontextprotocol/sdk/server/express.js';
import {z} from 'zod';
import {getInventory,getBilling} from './aws-read.ts';

export function makeServer(){
 const server=new McpServer({name:'nimbus-aws-readonly',version:'0.1.0'});
 server.registerTool('inspect_aws_inventory',{description:'Read the caller-configured AWS account inventory in one region. First 100 records per paginated service; no utilization or deletion claims.',inputSchema:{region:z.string().optional()},annotations:{readOnlyHint:true}},async({region})=>{
  try{return {content:[{type:'text' as const,text:JSON.stringify(await getInventory(region))}]};}
  catch(e){return {isError:true,content:[{type:'text' as const,text:`AWS inventory lookup failed: ${e instanceof Error?e.message:'unknown error'}`}]};}
 });
 server.registerTool('read_monthly_service_cost',{description:'Read service-level AWS Cost Explorer UnblendedCost for a month. Not a per-resource saving estimate.',inputSchema:{month:z.string().describe('YYYY-MM')},annotations:{readOnlyHint:true}},async({month})=>{
  try{return {content:[{type:'text' as const,text:JSON.stringify(await getBilling(month))}]};}
  catch(e){return {isError:true,content:[{type:'text' as const,text:`AWS billing lookup failed: ${e instanceof Error?e.message:'unknown error'}`}]};}
 });
 return server;
}
export function listTools(){
 return [
  {name:'inspect_aws_inventory',annotations:{readOnlyHint:true}},
  {name:'read_monthly_service_cost',annotations:{readOnlyHint:true}}
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
 const listener=app.listen(port,host,()=>{if(process.env.NODE_ENV!=='test')console.log(`Nimbus read-only MCP listening at http://${host}:${port}/mcp`)});
 return listener;
}
if(process.argv[1] && import.meta.url===new URL(`file://${process.argv[1]}`).href)start(Number(process.env.NIMBUS_MCP_PORT||8792));
