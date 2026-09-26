import {TrueForge} from '@truefoundry/trueforge-sdk';

const client=new TrueForge({baseUrl:process.env.TRUEFORGE_BASE_URL||'http://localhost:8790',timeoutInSeconds:20});
const action=process.argv[2];
const agentName='nimbus-cost-agent';
const scheduleName='nimbus-daily-cost-review';
const scheduleTask='Scheduled read-only AWS review. Call collect_cost_review_evidence once for the configured region and 14-day window. Report the account identity, 14-day hourly EC2 CPU/network window, 100-instance utilization cap, missing datapoints, capture times, inventory pagination, and Cost Explorer freshness. Explain the deterministic comparison of completed daily service totals; exclude the incomplete end date. Low CPU/network activity is a review signal only; request owner, workload, and dependency evidence before describing an instance as idle. Produce a concise evidence report with scope, relevant changes, missing data, and follow-up questions. Do not call mark_volume_for_review or perform any AWS write during a scheduled run. Do not claim per-resource cost, savings, waste, or deletion safety from these inputs.';
const manifest={cron:'0 9 * * *',timezone:'Asia/Kolkata',status:action==='enable'?'active':'paused',task:scheduleTask};

if(!['enable','pause'].includes(action)){
 console.error('Usage: npm run monitor:enable | npm run monitor:pause');
 process.exit(2);
}

try{
 const agents=await client.agents.list({agentName,limit:100});
 const agent=agents.data.find(item=>item.name===agentName);
 if(!agent){throw new Error(`Saved agent ${agentName} was not found. Configure a model in TrueForge and run npm run agent:install -- provider/model-name first.`);}
 const configuredMcp=agent.manifest.mcpServers?.find(server=>server.name==='nimbus-aws-review');
 const requiredTools=['collect_cost_review_evidence','inspect_aws_inventory','read_monthly_service_cost','read_recent_daily_service_cost','mark_volume_for_review'];
 if(!configuredMcp||requiredTools.some(name=>!configuredMcp.enableTools?.includes(name))||!configuredMcp.requireApprovalForTools?.includes('mark_volume_for_review')){
  throw new Error('The saved agent is missing expected Nimbus tools or the approval gate; repair and verify the agent before scheduling it.');
 }
 const connectors=await client.settings.mcpServers.list();
 if(!connectors.data?.some(server=>server.name==='nimbus-aws-review')){
  throw new Error('TrueForge Settings does not contain the nimbus-aws-review MCP connector.');
 }
 const schedules=await client.schedules.list({agentNames:agentName,limit:25});
 let matching=schedules.data.find(item=>item.name===scheduleName);
 while(!matching&&schedules.hasNextPage()){
  await schedules.getNextPage();
  matching=schedules.data.find(item=>item.name===scheduleName);
 }
 if(action==='pause'){
  if(!matching){console.log(`No ${scheduleName} schedule exists; nothing to pause.`);process.exit(0);}
  const result=await client.schedules.update(matching.id,{name:scheduleName,manifest:{...matching.manifest,status:'paused'}});
  const saved=await client.schedules.get(result.data.id);
  if(saved.data.manifest.status!=='paused')throw new Error('TrueForge did not confirm the schedule pause.');
  console.log(`Paused ${scheduleName}.`);
 }else{
  const result=matching
   ?await client.schedules.update(matching.id,{name:scheduleName,manifest})
   :await client.schedules.create({name:scheduleName,agentName,manifest});
  const saved=await client.schedules.get(result.data.id);
  if(saved.data.manifest.status!=='active'||saved.data.manifest.cron!=='0 9 * * *'||saved.data.manifest.timezone!=='Asia/Kolkata'){
   throw new Error('TrueForge did not confirm the expected active daily schedule.');
  }
  console.log(`Enabled ${scheduleName}: daily at 09:00 Asia/Kolkata.`);
  console.log('Each run creates a TrueForge agent session, makes AWS read calls, and may incur model/provider charges. Pause it with npm run monitor:pause.');
 }
}catch(error){
 console.error(`Monitor schedule ${action} failed: ${error instanceof Error?error.message:String(error)}`);
 process.exitCode=1;
}
