import {readFile} from 'node:fs/promises';
const target='http://127.0.0.1:8790';
try{
 const r=await fetch(`${target}/api/v1/health`,{signal:AbortSignal.timeout(2500)});
 console.log(`TrueForge local HTTP: ${r.status} (health path may vary)`);
}catch(e){console.error('TrueForge local server not reachable at 127.0.0.1:8790; start npx @truefoundry/trueforge@0.2.1');process.exitCode=1;}
try{
 const t=await fetch('http://127.0.0.1:8792/mcp',{signal:AbortSignal.timeout(2500)});
 console.log(`Nimbus MCP local endpoint: ${t.status} (GET should return 405)`);
 if(t.status!==405)process.exitCode=1;
}catch(e){console.error('Nimbus MCP server not reachable at 127.0.0.1:8792; start npm run mcp');process.exitCode=1;}
const spec=JSON.parse(await readFile(new URL('../trueforge-agent-spec.json',import.meta.url)));
console.log(`Agent spec: ${spec.name}; sandbox ${spec.manifest.config.sandbox.enabled}; approval ${spec.manifest.mcp_servers[0].require_approval_for_tools.join(', ')}`);
