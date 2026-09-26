import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const client=new Client({name:'nimbus-mcp-smoke',version:'0.1.0'});
const transport=new StreamableHTTPClientTransport(new URL('http://127.0.0.1:8792/mcp'));
await client.connect(transport);
const tools=await client.listTools();
console.log(JSON.stringify(tools.tools.map(({name,annotations})=>({name,readOnlyHint:annotations?.readOnlyHint})),null,2));
if(tools.tools.length!==2||tools.tools.some(t=>t.annotations?.readOnlyHint!==true))process.exitCode=1;
await client.close();
