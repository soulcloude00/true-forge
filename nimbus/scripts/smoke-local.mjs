import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const url=process.env.NIMBUS_MCP_URL||'http://127.0.0.1:8792/mcp';
const client=new Client({name:'nimbus-connector-check',version:'0.1.0'});
await client.connect(new StreamableHTTPClientTransport(new URL(url)));
const {tools}=await client.listTools();
console.log(tools.map(t=>`${t.name}: readOnly=${!!t.annotations?.readOnlyHint}`).join('\n'));
if(tools.length!==2||tools.some(t=>t.annotations?.readOnlyHint!==true))process.exitCode=1;
await client.close();
