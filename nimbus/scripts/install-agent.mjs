import {readFile} from 'node:fs/promises';
import {TrueForge} from '@truefoundry/trueforge-sdk';

const client=new TrueForge({baseUrl:process.env.TRUEFORGE_BASE_URL||'http://localhost:8790',timeoutInSeconds:15});
const spec=JSON.parse(await readFile(new URL('../trueforge-agent-spec.json',import.meta.url)));
const model=process.argv[2]||spec.manifest.model.name;
if(!model||!model.includes('/')||model==='REPLACE_WITH_CONFIGURED_MODEL'){console.error('Usage: npm run agent:install -- provider/model-name');process.exit(2);}
spec.manifest.model.name=model;
if(model==='openai/gpt-6-luna')spec.manifest.model.params={...(spec.manifest.model.params||{}),reasoningEffort:'none'};
const requiredApprovalTools=['mark_volume_for_review','delete_hackathon_demo_volume'];
const requiredTools=['collect_cost_review_evidence','inspect_aws_inventory','read_monthly_service_cost','read_recent_daily_service_cost',...requiredApprovalTools];
const desiredServer=spec.manifest.mcp_servers.find(s=>s.name==='nimbus-aws-review');
if(!desiredServer||requiredTools.some(name=>!desiredServer.enable_tools.includes(name))||requiredApprovalTools.some(name=>!desiredServer.require_approval_for_tools.includes(name))){
 console.error('Refusing to install: the agent spec must enable the evidence tools and require approval for both write tools.');
 process.exit(2);
}

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

function verifySavedAgent(agent){
 const server=agent?.manifest?.mcpServers?.find(s=>s.name==='nimbus-aws-review');
 const enabled=server?.enableTools||[];
 const approval=server?.requireApprovalForTools||[];
 const missing=requiredTools.filter(name=>!enabled.includes(name));
 const savedModel=agent?.manifest?.model?.name;
 const savedEffort=agent?.manifest?.model?.params?.reasoningEffort;
 const missingApprovals=requiredApprovalTools.filter(name=>!approval.includes(name));
 if(missing.length||missingApprovals.length||savedModel!==model||(model==='openai/gpt-6-luna'&&savedEffort!=='none')){
  throw new Error(`Saved agent verification failed: missing enabled tools [${missing.join(', ')}]; missing approval selectors [${missingApprovals.join(', ')}]; model [${savedModel||'missing'}]; reasoning effort [${savedEffort||'default'}]`);
 }
 return {enabled,approval,model:savedModel,reasoningEffort:savedEffort};
}

try{
 await ensureSkills();
 const configuredModels=await client.models.list();
 if(!configuredModels.data.some(item=>item.name===model)){
  if(model!=='openai/gpt-6-luna')throw new Error(`Model ${model} is not available in TrueForge Settings.`);
  const providers=await client.settings.modelProviders.list();
  const provider=providers.data.find(item=>item.name==='openai');
  if(!provider?.manifest.auth?.apiKey)throw new Error('Configure the OpenAI provider in TrueForge Settings before adding gpt-6-luna.');
  const providerModels=provider.manifest.models||[];
  if(!providerModels.some(item=>item.modelId==='gpt-6-luna'))providerModels.push({modelId:'gpt-6-luna',name:'gpt-6-luna',properties:{contextLength:1050000,maxOutputTokens:128000,reasoningEfforts:['none','low','medium','high','xhigh','max']}});
  await client.settings.modelProviders.createOrUpdate({manifest:{...provider.manifest,models:providerModels,auth:{...provider.manifest.auth,apiKey:'<redacted>'}}});
  const refreshed=await client.models.list();
  if(!refreshed.data.some(item=>item.name==='openai/gpt-6-luna'))throw new Error('TrueForge did not expose openai/gpt-6-luna after registering it on the configured OpenAI provider.');
  console.log('Added gpt-6-luna to the existing OpenAI provider; saved credential preserved.');
 }
 const response=await client.agents.list();
 const existing=response.data||[];
 if(existing.some(a=>a.name===spec.name)){console.error(`${spec.name} already exists; inspect it in the UI before replacing a working agent.`);process.exit(2);}
 const {data:created}=await client.agents.create({name:spec.name,description:spec.description,manifest:{model:spec.manifest.model,instructions:spec.manifest.instructions,skills:spec.manifest.skills,mcpServers:spec.manifest.mcp_servers.map(s=>({name:s.name,enableTools:s.enable_tools,requireApprovalForTools:s.require_approval_for_tools,preload:s.preload})),config:{sandbox:spec.manifest.config.sandbox,generativeUi:spec.manifest.config.generative_ui,askUserQuestions:spec.manifest.config.ask_user_questions,iterationLimit:spec.manifest.config.iteration_limit}}});
 const saved=created.id?await client.agents.get(created.id):{data:created};
 const verified=verifySavedAgent(saved.data);
 console.log(`Created and verified ${saved.data.name||spec.name} in TrueForge, id ${saved.data.id||'returned by server'}`);
 console.log(`Enabled tools: ${verified.enabled.join(', ')}`);
 console.log(`Approval selectors: ${verified.approval.join(', ')}`);
 console.log(`Model: ${verified.model}${verified.reasoningEffort?` (reasoning effort ${verified.reasoningEffort})`:''}`);
}catch(e){console.error(`Agent registration or saved-manifest verification failed: ${e instanceof Error?e.message:String(e)}. Verify local TrueForge, configured model, MCP connector, and sandbox Settings.`);process.exit(1);}
