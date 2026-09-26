import {useCallback,useEffect,useState} from 'react';
import {TrueForge} from '@truefoundry/trueforge-sdk';

const agentName='nimbus-cost-agent';
const scheduleName='nimbus-daily-cost-review';
const scheduleTask='Scheduled read-only AWS review. Call inspect_aws_inventory for the configured AWS region and read_recent_daily_service_cost for the last 14 complete UTC days. Validate account identity, capture times, pagination and Cost Explorer data freshness. Compare completed daily service totals over time, separating data lag from a real change. Produce a concise evidence report with scope, relevant changes, missing data, and follow-up questions. Do not call mark_volume_for_review or perform any AWS write during a scheduled run. Do not claim per-resource cost, savings, waste, or deletion safety from these inputs.';
const scheduleManifest={cron:'0 9 * * *',timezone:'Asia/Kolkata',status:'active' as const,task:scheduleTask};

type MonitorState={status:'loading'|'needs-setup'|'inactive'|'paused'|'active';scheduleId?:string;message?:string;configurationReady?:boolean};

function configuredAgentReady(agent:Awaited<ReturnType<TrueForge['agents']['get']>>['data']|undefined,connectorNames:string[]){
 const server=agent?.manifest.mcpServers?.find(item=>item.name==='nimbus-aws-review');
 const expected=['inspect_aws_inventory','read_monthly_service_cost','read_recent_daily_service_cost','mark_volume_for_review'];
 return !!agent&&!!server&&expected.every(name=>server.enableTools?.includes(name))&&server.requireApprovalForTools?.includes('mark_volume_for_review')===true&&connectorNames.includes('nimbus-aws-review');
}

export function TrueForgeMonitor(){
 const [monitor,setMonitor]=useState<MonitorState>({status:'loading'});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [confirm,setConfirm]=useState(false);

 const load=useCallback(async()=>{
  setError('');
  try{
   const client=new TrueForge({baseUrl:`${window.location.origin}/api/trueforge`,timeoutInSeconds:20});
   const [agents,connectors,schedules]=await Promise.all([client.agents.list({agentName,limit:100}),client.settings.mcpServers.list(),client.schedules.list({agentNames:agentName,limit:25})]);
   const agent=agents.data.find(item=>item.name===agentName);
   let schedule=schedules.data.find(item=>item.name===scheduleName);
   while(!schedule&&schedules.hasNextPage()){
    await schedules.getNextPage();
    schedule=schedules.data.find(item=>item.name===scheduleName);
   }
   const ready=configuredAgentReady(agent,connectors.data?.map(item=>item.name)||[]);
   const status=schedule?(schedule.manifest.status==='active'?'active':'paused'):(ready?'inactive':'needs-setup');
   const message=ready?undefined:agent?'The saved agent or MCP connector is missing a required tool or approval gate. Pause any active schedule, then repair the agent.':'Add a model provider and save the Nimbus agent in TrueForge first.';
   setMonitor({status,scheduleId:schedule?.id,message,configurationReady:ready});
  }catch(e){
   setError(e instanceof Error?e.message:'Could not read monitoring status from TrueForge.');
   setMonitor({status:'needs-setup'});
  }
 },[]);

 useEffect(()=>{void load()},[load]);

 const setSchedule=async(action:'enable'|'pause')=>{
  setBusy(true);setError('');
  try{
   const client=new TrueForge({baseUrl:`${window.location.origin}/api/trueforge`,timeoutInSeconds:20});
   if(action==='enable'){
    const [agents,connectors]=await Promise.all([client.agents.list({agentName,limit:100}),client.settings.mcpServers.list()]);
    const agent=agents.data.find(item=>item.name===agentName);
    if(!agent)throw new Error('Save nimbus-cost-agent in TrueForge before enabling monitoring.');
    if(!configuredAgentReady(agent,connectors.data?.map(item=>item.name)||[]))throw new Error('The saved agent, MCP connector, tools, or approval gate is not configured correctly.');
   }
   const schedules=await client.schedules.list({agentNames:agentName,limit:25});
   let existing=schedules.data.find(item=>item.name===scheduleName);
   while(!existing&&schedules.hasNextPage()){
    await schedules.getNextPage();
    existing=schedules.data.find(item=>item.name===scheduleName);
   }
   if(action==='pause'){
    if(!existing){setMonitor({status:'inactive'});return;}
    const result=await client.schedules.update(existing.id,{name:scheduleName,manifest:{...existing.manifest,status:'paused'}});
    const saved=await client.schedules.get(result.data.id);
    if(saved.data.manifest.status!=='paused')throw new Error('TrueForge did not confirm that monitoring was paused.');
    setMonitor({status:'paused',scheduleId:saved.data.id});
   }else{
    const result=existing
     ?await client.schedules.update(existing.id,{name:scheduleName,manifest:scheduleManifest})
     :await client.schedules.create({name:scheduleName,agentName,manifest:scheduleManifest});
    const saved=await client.schedules.get(result.data.id);
    if(saved.data.manifest.status!=='active'||saved.data.manifest.cron!=='0 9 * * *'||saved.data.manifest.timezone!=='Asia/Kolkata')throw new Error('TrueForge did not confirm the expected daily schedule.');
    setMonitor({status:'active',scheduleId:saved.data.id});
    setConfirm(false);
   }
  }catch(e){setError(e instanceof Error?e.message:'Could not update the TrueForge monitoring schedule.');}
  finally{setBusy(false)}
 };

 const statusLabel={loading:'Checking TrueForge…','needs-setup':'Setup required',inactive:'Not scheduled',paused:'Paused',active:'Daily monitoring on'}[monitor.status];
 return <section className="trueforge-monitor" aria-labelledby="trueforge-monitor-title">
  <div className="monitor-heading"><div><span className="small-label">OPTIONAL · READ-ONLY SCHEDULE</span><h2 id="trueforge-monitor-title">Daily cloud review</h2><p>TrueForge can check inventory in the configured AWS region and recent service costs every day, then save the evidence as a session.</p></div><span className={`monitor-status monitor-status-${monitor.status}`}>{statusLabel}</span></div>
  <div className="monitor-details"><div><b>Runs</b><span>Daily at 09:00 IST</span></div><div><b>Scope</b><span>Configured region · 14 complete UTC cost days</span></div><div><b>Action boundary</b><span>No AWS writes during scheduled runs</span></div></div>
  <p className="monitor-caveat">Cost Explorer data may lag. This first version does not scan every region, maintain a separate baseline, or send external alerts. Each run creates a model session and makes AWS read calls, which may incur provider charges.</p>
  {monitor.message&&<p className="monitor-message">{monitor.message}</p>}
  {error&&<p className="monitor-error" role="alert">{error}</p>}
  <div className="monitor-actions">
   {monitor.status==='active'
    ?<button className="agent-deny-button" onClick={()=>void setSchedule('pause')} disabled={busy}>Pause daily reviews</button>
    :<button className="agent-run-button" onClick={()=>setConfirm(true)} disabled={busy||monitor.status==='loading'||monitor.status==='needs-setup'||monitor.configurationReady===false}>{monitor.status==='paused'?'Resume daily reviews':'Enable daily reviews'}</button>}
   <button className="monitor-refresh" onClick={()=>void load()} disabled={busy||monitor.status==='loading'}>Refresh status</button>
  </div>
  {confirm&&<div className="monitor-confirm" role="alertdialog" aria-labelledby="monitor-confirm-title" aria-describedby="monitor-confirm-description">
   <h3 id="monitor-confirm-title">Enable daily AWS reviews?</h3>
   <p id="monitor-confirm-description">This creates an active TrueForge schedule at 09:00 Asia/Kolkata. It will make daily AWS read calls and model requests, may incur usage charges, and will keep creating session reports until paused.</p>
   <div><button className="agent-run-button" onClick={()=>void setSchedule('enable')} disabled={busy}>{busy?'Enabling…':'Confirm and enable'}</button><button className="agent-deny-button" onClick={()=>setConfirm(false)} disabled={busy}>Cancel</button></div>
  </div>}
 </section>
}
