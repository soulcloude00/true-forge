import {readFile} from 'node:fs/promises';
import {TrueForge} from '@truefoundry/trueforge-sdk';

const client=new TrueForge({baseUrl:process.env.TRUEFORGE_BASE_URL||'http://localhost:8790',timeoutInSeconds:15});
const spec=JSON.parse(await readFile(new URL('../trueforge-agent-spec.json',import.meta.url)));
const requiredTools=['collect_cost_review_evidence','inspect_aws_inventory','read_monthly_service_cost','read_recent_daily_service_cost','mark_volume_for_review'];
const requiredApproval='mark_volume_for_review';

async function ensureSkills(){
 const existing=(await client.settings.skills.list()).data||[];
 for(const desired of spec.skill_catalog||[]){
  const found=existing.find(item=>item.manifest?.name===desired.name);
  if(found){
   const current=found.manifest;
   if(current.url!==desired.url||current.path!==desired.path||current.ref!==desired.ref)throw new Error(`TrueForge skill ${desired.name} already points to a different source; refusing to replace it.`);
   continue;
  }
  await client.settings.skills.create({manifest:desired});
 }
}

try{
 const listed=await client.agents.list({agentName:spec.name,limit:100});
 const agent=listed.data.find(item=>item.name===spec.name);
 if(!agent?.id)throw new Error(`Saved agent ${spec.name} was not found.`);
 const currentManifest=agent.manifest;
 await ensureSkills();
 const mcpServers=spec.manifest.mcp_servers.map(server=>({name:server.name,enableTools:server.enable_tools,requireApprovalForTools:server.require_approval_for_tools,preload:server.preload}));
 await client.agents.update(agent.id,{manifest:{...currentManifest,instructions:spec.manifest.instructions,skills:spec.manifest.skills,mcpServers}});
 const saved=await client.agents.get(agent.id);
 const manifest=saved.data.manifest;
 const server=manifest.mcpServers?.find(item=>item.name==='nimbus-aws-review');
 const enabled=server?.enableTools||[];
 const approval=server?.requireApprovalForTools||[];
 if(requiredTools.some(name=>!enabled.includes(name))||!approval.includes(requiredApproval)||manifest.model?.name!=='openai/gpt-6-luna'||manifest.model?.params?.reasoningEffort!=='none'||(spec.manifest.skills||[]).some(skill=>!manifest.skills?.some(saved=>saved.name===skill.name))){
  throw new Error('Read-back verification failed for the saved model, tools, or approval selector.');
 }
 console.log(`Updated and verified saved agent ${spec.name} (${agent.id}).`);
 console.log(`Model: ${manifest.model.name}; reasoning effort: ${manifest.model.params.reasoningEffort}`);
 console.log(`Enabled tools: ${enabled.join(', ')}`);
 console.log(`Approval selector: ${approval.join(', ')}`);
}catch(error){
 console.error(`Agent update failed: ${error instanceof Error?error.message:String(error)}`);
 process.exitCode=1;
}
