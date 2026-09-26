import {TrueForge} from '@truefoundry/trueforge-sdk';

const client=new TrueForge({baseUrl:process.env.TRUEFORGE_BASE_URL||'http://localhost:8790',timeoutInSeconds:20});
const action=process.argv[2];
const agentName='nimbus-cost-agent';
const scheduleName='nimbus-daily-cost-review';
const scheduleTask='Scheduled Nimbus cost review. Call collect_cost_review_evidence exactly once for the configured region and 14-day window; its schema is enabled, so do not call list_tools or get_tool_info first. The tool reads AWS evidence and records a bounded local baseline for the exact account and region; local history does not modify AWS resources. Report identity, hourly EC2 CPU/network coverage, 100-instance limit, missing datapoints, capture time, pagination, and Cost Explorer freshness. Explain first-run or overlap status; when compared, state previous capture, number of overlapping complete UTC dates, and deterministic account/service changes. Exclude the incomplete end date. Cost Explorer can revise or lag; changes are not anomaly verdicts. In the final TrueForge session, use native Generative UI/OpenUI for a compact evidence panel with scope, baseline, up to five service changes, coverage caveats, and follow-up questions; do not create a separate page. Produce a concise Markdown report as well. Low CPU/network activity is only a review signal; request owner, workload, and dependency evidence before describing an instance as idle. Never call mark_volume_for_review or delete_hackathon_demo_volume or perform any AWS resource write during a scheduled run. Do not claim per-resource cost, savings, waste, or deletion safety.';
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
 const requiredTools=['collect_cost_review_evidence','inspect_aws_inventory','read_monthly_service_cost','read_recent_daily_service_cost','mark_volume_for_review','delete_hackathon_demo_volume'];
 const requiredApprovals=['mark_volume_for_review','delete_hackathon_demo_volume'];
 if(!configuredMcp||requiredTools.some(name=>!configuredMcp.enableTools?.includes(name))||requiredApprovals.some(name=>!configuredMcp.requireApprovalForTools?.includes(name))){
  throw new Error('The saved agent is missing expected Nimbus tools or the approval gates; repair and verify the agent before scheduling it.');
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
  console.log('Each run creates a TrueForge agent session, makes AWS read calls, records local baseline history, and may incur model/provider charges. Pause it with npm run monitor:pause.');
 }
}catch(error){
 console.error(`Monitor schedule ${action} failed: ${error instanceof Error?error.message:String(error)}`);
 process.exitCode=1;
}
