import {readFile} from 'node:fs/promises';
import {TrueForge} from '@truefoundry/trueforge-sdk';

const client=new TrueForge({baseUrl:process.env.TRUEFORGE_BASE_URL||'http://localhost:8790',timeoutInSeconds:15});
const model=process.argv[2];
if(!model||!model.includes('/')){console.error('Usage: npm run agent:install -- provider/model-name (use a model configured in local TrueForge Settings)');process.exit(2);}

const spec=JSON.parse(await readFile(new URL('../trueforge-agent-spec.json',import.meta.url)));
spec.manifest.model.name=model;
const requiredApprovalTool='mark_volume_for_review';
const requiredTools=['inspect_aws_inventory','read_monthly_service_cost',requiredApprovalTool];
const desiredServer=spec.manifest.mcp_servers.find(s=>s.name==='nimbus-aws-review');
if(!desiredServer||requiredTools.some(name=>!desiredServer.enable_tools.includes(name))||!desiredServer.require_approval_for_tools.includes(requiredApprovalTool)){
 console.error('Refusing to install: the agent spec must enable all three Nimbus tools and require approval for mark_volume_for_review.');
 process.exit(2);
}

function verifySavedAgent(agent){
 const server=agent?.manifest?.mcpServers?.find(s=>s.name==='nimbus-aws-review');
 const enabled=server?.enableTools||[];
 const approval=server?.requireApprovalForTools||[];
 const missing=requiredTools.filter(name=>!enabled.includes(name));
 if(missing.length||!approval.includes(requiredApprovalTool)){
  throw new Error(`Saved agent verification failed: missing enabled tools [${missing.join(', ')}]; approval selectors [${approval.join(', ')}]`);
 }
 return {enabled,approval};
}

try{
 const response=await client.agents.list();
 const existing=response.data||[];
 if(existing.some(a=>a.name===spec.name)){console.error(`${spec.name} already exists; inspect it in the UI before replacing a working agent.`);process.exit(2);}
 const {data:created}=await client.agents.create({name:spec.name,description:'Approval-first AWS cost review with evidence tools and one gated review-tag action',manifest:{model:spec.manifest.model,instructions:spec.manifest.instructions,mcpServers:spec.manifest.mcp_servers.map(s=>({name:s.name,enableTools:s.enable_tools,requireApprovalForTools:s.require_approval_for_tools,preload:s.preload})),config:{sandbox:spec.manifest.config.sandbox,generativeUi:spec.manifest.config.generative_ui,askUserQuestions:spec.manifest.config.ask_user_questions,iterationLimit:spec.manifest.config.iteration_limit}}});
 const saved=created.id?await client.agents.get(created.id):{data:created};
 const verified=verifySavedAgent(saved.data);
 console.log(`Created and verified ${saved.data.name||spec.name} in TrueForge, id ${saved.data.id||'returned by server'}`);
 console.log(`Enabled tools: ${verified.enabled.join(', ')}`);
 console.log(`Approval selectors: ${verified.approval.join(', ')}`);
}catch(e){console.error(`Agent registration or saved-manifest verification failed: ${e instanceof Error?e.message:String(e)}. Verify local TrueForge, configured model, MCP connector, and sandbox Settings.`);process.exit(1);}
