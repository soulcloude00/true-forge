import {TrueForge} from '@truefoundry/trueforge-sdk';

const baseUrl=process.env.TRUEFORGE_BASE_URL||'http://localhost:8790';
const mcpUrl=process.env.NIMBUS_MCP_URL||'http://127.0.0.1:8792/mcp';
const client=new TrueForge({baseUrl,timeoutInSeconds:10});
const spec=JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../trueforge-agent-spec.json',import.meta.url)));
const agentName=spec.name;
const requiredTools=['inspect_aws_inventory','read_monthly_service_cost','read_recent_daily_service_cost','mark_volume_for_review'];
const readiness={server:false,mcp:false,model:false,connector:false,agent:false,sandbox:false};
const failures=[];

try{
 const response=await fetch(`${baseUrl}/api/v1/capabilities`,{signal:AbortSignal.timeout(2500)});
 readiness.server=response.ok;
 console.log(`TrueForge API: ${response.status} ${response.ok?'reachable':'unavailable'} (${baseUrl})`);
 if(!response.ok) failures.push('TrueForge API is not available.');
}catch(e){
 console.error(`TrueForge API unreachable at ${baseUrl}: ${e instanceof Error?e.message:String(e)}`);
 failures.push('Start the local TrueForge server.');
}

try{
 const response=await fetch(mcpUrl,{signal:AbortSignal.timeout(2500)});
 readiness.mcp=response.status===405;
 console.log(`Nimbus MCP endpoint: HTTP ${response.status} ${readiness.mcp?'reachable':'unexpected response'} (${mcpUrl})`);
 if(!readiness.mcp) failures.push('Start Nimbus MCP at the configured URL.');
}catch(e){
 console.error(`Nimbus MCP unreachable at ${mcpUrl}: ${e instanceof Error?e.message:String(e)}`);
 failures.push('Start the Nimbus MCP server.');
}

if(readiness.server){
 try{
  const [models,connectors,agents,providers]=await Promise.all([
   client.models.list(),client.settings.mcpServers.list(),client.agents.list({agentName,limit:100}),client.settings.modelProviders.list()
  ]);
  readiness.model=models.data.length>0;
  console.log(`Configured model providers: ${providers.data.length}; available models: ${models.data.length}`);
  if(!readiness.model) failures.push('Configure a model provider/model in TrueForge Settings.');

  const connector=connectors.data.find(item=>item.name==='nimbus-aws-review');
  readiness.connector=!!connector;
  console.log(`Nimbus MCP connector: ${readiness.connector?'configured':'missing'}`);
  if(!readiness.connector) failures.push('Configure the nimbus-aws-review connector in TrueForge Settings.');

  const agent=agents.data.find(item=>item.name===agentName);
  if(agent){
   const server=agent.manifest.mcpServers?.find(item=>item.name==='nimbus-aws-review');
   const approval=server?.requireApprovalForTools?.includes('mark_volume_for_review')===true;
   const enabled=requiredTools.every(name=>server?.enableTools?.includes(name));
   const modelName=agent.manifest.model?.name;
   const modelAvailable=models.data.some(model=>model.name===modelName);
   const reasoningEffort=agent.manifest.model?.params?.reasoningEffort;
   const effortReady=modelName!=='openai/gpt-6-luna'||reasoningEffort==='none';
   readiness.agent=enabled&&approval&&modelAvailable&&effortReady;
   console.log(`Saved agent ${agentName}: ${readiness.agent?'ready':'needs repair'}; model ${modelName||'missing'} ${modelAvailable?'available':'unavailable'}${modelName==='openai/gpt-6-luna'?`; reasoning effort ${reasoningEffort||'default'}`:''}`);
   if(!modelAvailable)failures.push(`Add/configure the saved agent model ${modelName||'(missing)'} in TrueForge Settings.`);
   if(!effortReady)failures.push('Set gpt-6-luna reasoning effort to none so Chat Completions tool calling works.');
   if(!enabled||!approval)failures.push('Repair the saved agent tools and mark_volume_for_review approval gate.');
  }else{
   console.log(`Saved agent ${agentName}: missing`);
   failures.push('Install nimbus-cost-agent after selecting a configured model.');
  }
  try{
   const sandbox=await client.settings.sandboxProviders.get();
   readiness.sandbox=!!sandbox.data;
   console.log(`Sandbox provider: ${readiness.sandbox?'configured':'missing'}`);
  }catch(e){
   console.log(`Sandbox provider: missing (${e instanceof Error?e.message:String(e)})`);
  }
  if(!readiness.sandbox) failures.push('Configure a TrueForge sandbox provider to demonstrate isolated evidence validation.');
 }catch(e){
  console.error(`Could not inspect TrueForge configuration: ${e instanceof Error?e.message:String(e)}`);
  failures.push('Resolve TrueForge API access before setup verification.');
 }
}

if(failures.length){
 console.error('\nSetup is not ready:');
 for(const failure of failures) console.error(`- ${failure}`);
 process.exitCode=1;
}else{
 console.log('\nSetup ready for a live Nimbus agent session.');
}
