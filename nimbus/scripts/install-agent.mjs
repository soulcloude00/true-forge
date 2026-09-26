import {readFile} from 'node:fs/promises';
import {TrueForge} from '@truefoundry/trueforge-sdk';
const client=new TrueForge({baseUrl:process.env.TRUEFORGE_BASE_URL||'http://127.0.0.1:8790',timeoutInSeconds:15});
const model=process.argv[2];
if(!model||!model.includes('/')){console.error('Usage: npm run agent:install -- provider/model-name (use a model configured in local TrueForge Settings)');process.exit(2);}
const spec=JSON.parse(await readFile(new URL('../trueforge-agent-spec.json',import.meta.url)));
spec.manifest.model.name=model;
try{
 const response=await client.agents.list();
 const existing=response.data||[];
 if(existing.some(a=>a.name===spec.name)){console.error(`${spec.name} already exists; inspect it in the UI before updating to avoid replacing a working agent.`);process.exit(2);}
 const {data}=await client.agents.create({name:spec.name,description:'Approval-first AWS cost review with read-only MCP evidence',manifest:{model:spec.manifest.model,instructions:spec.manifest.instructions,mcpServers:spec.manifest.mcp_servers.map(s=>({name:s.name,enableTools:s.enable_tools,requireApprovalForTools:s.require_approval_for_tools,preload:s.preload})),config:{sandbox:spec.manifest.config.sandbox,generativeUi:spec.manifest.config.generative_ui,askUserQuestions:spec.manifest.config.ask_user_questions,iterationLimit:spec.manifest.config.iteration_limit}}});
 console.log(`Created ${data.name||spec.name} in TrueForge, id ${data.id||'returned by server'}`);
}catch(e){console.error(`Agent registration failed: ${e instanceof Error?e.message:String(e)}. Verify local TrueForge, model, MCP connector, and Daytona sandbox Settings.`);process.exit(1);}
