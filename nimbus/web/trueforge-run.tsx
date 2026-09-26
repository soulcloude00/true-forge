import {useState} from 'react';
import {TrueForge,TrueForgeApi,isEventDelta,mergeEventDelta} from '@truefoundry/trueforge-sdk';

type Approval={threadId:string;toolCallId:string;toolName:string;argumentsText:string};
type EventIndex=Map<string,TrueForgeApi.TurnStreamingEvent>;
type ToolCallEvidence={type:string;name:string};
type HarnessEvidence={mcpToolResponse:boolean;sandboxCreated:boolean;sandboxToolResponse:boolean;approvalPaused:boolean;baselineRecorded:boolean;baselineStatus:string|null;baselineDaysCompared:number|null};

function eventText(content:TrueForgeApi.ModelMessageEvent['content']):string{
 if(typeof content==='string')return content;
 return content?.flatMap(part=>part.type==='text'?[part.text]:[]).join('')||'';
}

function label(event:TrueForgeApi.TurnStreamingEvent):string{
 switch(event.type){
  case 'sandbox.created':return 'TrueForge sandbox created';
  case 'mcp.initialize':return `MCP tools connected · ${event.mcpServers.map(server=>server.name).join(', ')||'server ready'}`;
  case 'tool.approval_required':return 'TrueForge paused for human approval';
  case 'tool.response_required':return 'TrueForge paused for a tool response';
  case 'mcp.auth_required':return 'MCP authentication required';
  case 'turn.created':return 'Agent turn started';
  case 'turn.done':return `Agent turn ended · ${event.state.status}`;
  case 'model.message':return event.toolCalls?.length?`Tool requested · ${event.toolCalls.map(call=>call.function.name).join(', ')}`:'Agent message';
  case 'model.message.delta':return 'Agent response streaming';
  case 'tool.response':return 'Tool result received';
  case 'turn.update':return 'Agent turn updated';
  case 'thread.created':return `Subagent started · ${event.title}`;
  case 'thread.done':return 'Subagent finished';
 }
}

export function TrueForgeRun(){
 const [prompt,setPrompt]=useState('Run one Nimbus cost review for my configured AWS account and region. Call collect_cost_review_evidence exactly once first; its tool schema is enabled, so do not call list_tools or get_tool_info. Explain the local account/region baseline status, previous capture, overlapping complete UTC dates, and service-level changes. Use TrueForge sandbox execution to validate the structured result and create a dated Markdown report. In this same TrueForge session, show a compact native Generative UI/OpenUI panel for scope, baseline, up to five service changes, evidence coverage, and follow-up questions; do not create a separate page. Explain Cost Explorer freshness and that service-level totals are not per-resource costs. Low activity is only a review signal, never proof of idleness or deletion safety. The baseline updates local Nimbus history only. Never call mark_volume_for_review unless I separately ask to tag one specific volume. Never call delete_hackathon_demo_volume unless I explicitly ask to delete the single operator-configured, disposable hackathon demo volume; show its exact account, region, volume ID, and irreversible effect, require TrueForge approval, and stop if denied. Never use it for another resource, call it from a scheduled run, or stop or snapshot AWS resources.');
 const [events,setEvents]=useState<string[]>([]);
 const [answer,setAnswer]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [sessionId,setSessionId]=useState('');
 const [pending,setPending]=useState<Approval[]>([]);
 const [evidence,setEvidence]=useState<HarnessEvidence>({mcpToolResponse:false,sandboxCreated:false,sandboxToolResponse:false,approvalPaused:false,baselineRecorded:false,baselineStatus:null,baselineDaysCompared:null});

 const consume=async(stream:Awaited<ReturnType<TrueForge['sessions']['createTurnStream']>>,index:EventIndex)=>{
  const toolCalls=new Map<string,ToolCallEvidence>();
  for await(const {data:event} of stream.withMetadata()){
   let recordedEvent:TrueForgeApi.TurnStreamingEvent=event;
   if(isEventDelta(event)){
    const base=index.get(event.id);
    if(base){mergeEventDelta(base,event);recordedEvent=base;}
   }else{index.set(event.id,event);recordedEvent=event;}
   if(recordedEvent.type==='model.message')for(const call of recordedEvent.toolCalls||[])toolCalls.set(call.id,{type:call.toolInfo.type,name:call.function.name});
   if(event.type==='model.message.delta'&&event.threadId==='main'&&event.content)setAnswer(current=>current+event.content);
   if(event.type==='tool.approval_required'){
    const items:Approval[]=[];
    for(const ref of event.toolCalls){
     const message=index.get(ref.sourceEventId);
     if(message?.type!=='model.message')continue;
     const call=message.toolCalls?.find(item=>item.id===ref.id);
     if(call)items.push({threadId:event.threadId,toolCallId:ref.id,toolName:call.function.name,argumentsText:call.function.arguments});
    }
    setPending(items);
    setEvidence(value=>({...value,approvalPaused:true}));
   }
   if(event.type==='sandbox.created')setEvidence(value=>({...value,sandboxCreated:true}));
   if(event.type==='tool.response'){
    const call=toolCalls.get(event.toolCallId);
    if(call?.type==='mcp')setEvidence(value=>({...value,mcpToolResponse:true}));
    if(call?.name==='collect_cost_review_evidence'){
     try{const output=JSON.parse(event.content) as {baseline?:{status?:string;daysCompared?:number};structuredContent?:{baseline?:{status?:string;daysCompared?:number}}};const baseline=output.structuredContent?.baseline||output.baseline;if(baseline?.status)setEvidence(value=>({...value,baselineRecorded:baseline.status!=='storage_unavailable',baselineStatus:baseline.status||null,baselineDaysCompared:typeof baseline.daysCompared==='number'?baseline.daysCompared:null}))}catch{}
    }
    if(call?.type==='truefoundry-system'&&/(sandbox|code)/i.test(call.name))setEvidence(value=>({...value,sandboxToolResponse:true}));
   }
   if(event.type==='turn.done'&&event.state.status==='done'){
    const finalText=eventText(event.state.output?.content??null);
    if(finalText)setAnswer(finalText);
   }
   setEvents(current=>[...current,label(event)]);
  }
 };

 const run=async()=>{
  setBusy(true);setEvents([]);setAnswer('');setPending([]);setError('');setSessionId('');setEvidence({mcpToolResponse:false,sandboxCreated:false,sandboxToolResponse:false,approvalPaused:false,baselineRecorded:false,baselineStatus:null,baselineDaysCompared:null});
  try{
   const client=new TrueForge({baseUrl:`${window.location.origin}/api/trueforge`,timeoutInSeconds:600});
   const {data:session}=await client.sessions.create({agent:{name:'nimbus-cost-agent'}});
   setSessionId(session.id);
   const index:EventIndex=new Map();
   const stream=await client.sessions.createTurnStream(session.id,{input:[{type:'user.message',content:prompt}]});
   await consume(stream,index);
  }catch(e){setError(e instanceof Error?e.message:'TrueForge turn could not be completed.');}
  finally{setBusy(false)}
 };

 const decide=async(status:'allow'|'deny')=>{
  if(!sessionId||pending.length===0)return;
  setBusy(true);setError('');
  const decisions:TrueForgeApi.UserToolApprovalEvent[]=pending.map(item=>({type:'user.tool_approval',threadId:item.threadId,toolCallId:item.toolCallId,approval:status==='allow'?{status:'allow'}:{status:'deny',reason:'Human reviewer rejected this exact AWS tag change.'}}));
  setPending([]);
  try{
   const client=new TrueForge({baseUrl:`${window.location.origin}/api/trueforge`,timeoutInSeconds:600});
   const index:EventIndex=new Map();
   const stream=await client.sessions.createTurnStream(sessionId,{input:decisions});
   await consume(stream,index);
  }catch(e){setError(e instanceof Error?e.message:'Could not send the approval decision to TrueForge.');}
  finally{setBusy(false)}
 };

 return <section className="trueforge-run" aria-labelledby="trueforge-run-title">
  <div className="live-head"><div><span className="small-label">TRUEFORGE SDK · LIVE SESSION · NATIVE REVIEW PANEL</span><h2 id="trueforge-run-title">Run the Nimbus agent</h2><p>This starts the saved <code>nimbus-cost-agent</code> in TrueForge. Tool calls, baseline result, sandbox events, and native OpenUI output come from its actual event stream. The only AWS resource write is an exact reversible review tag that waits for TrueForge approval; a separate local history snapshot updates automatically.</p></div><a href="http://localhost:8790" target="_blank" rel="noopener noreferrer">Open TrueForge ↗</a></div>
  <label className="agent-prompt-label">Investigation request<textarea value={prompt} onChange={event=>setPrompt(event.target.value)} rows={5} disabled={busy}/></label>
  <button className="agent-run-button" onClick={()=>void run()} disabled={busy||!prompt.trim()}>{busy?'Running in TrueForge…':'Start TrueForge investigation'}</button>
  {sessionId&&<p className="agent-session-id"><b>TrueForge session</b> <code>{sessionId}</code></p>}
  {error&&<div role="alert" className="live-error"><strong>TrueForge request failed</strong><p>{error}</p><span>Confirm TrueForge is running at localhost:8790 and that its saved agent, model, connector, AWS permission, and sandbox are configured.</span></div>}
  {pending.length>0&&<div className="agent-approval" role="alert"><span className="small-label">TRUEFORGE APPROVAL REQUIRED</span><h3>Review this exact AWS change</h3><p>Allowing this call adds one fixed review marker to a currently available, unattached EBS volume. It does not delete, stop, snapshot, or approve cleanup of the volume. Check the account, region, and ID before allowing it.</p>
   {pending.map(item=><article key={item.toolCallId}><b>{item.toolName}</b><pre>{item.argumentsText}</pre></article>)}
   <div><button className="agent-run-button" onClick={()=>void decide('allow')} disabled={busy}>Allow this tag change</button><button className="agent-deny-button" onClick={()=>void decide('deny')} disabled={busy}>Reject</button></div>
  </div>}
  {events.length>0&&<div className="harness-evidence" aria-live="polite"><h3>Observed harness evidence</h3><ul>
   <li data-complete={evidence.mcpToolResponse}>{evidence.mcpToolResponse?'Observed':'Not observed'} · Nimbus MCP tool response</li>
   <li data-complete={evidence.baselineRecorded}>{evidence.baselineStatus?`Observed · local baseline ${evidence.baselineStatus}${evidence.baselineDaysCompared===null?'':` · ${evidence.baselineDaysCompared} overlapping days`}`:'Not observed · local baseline result'}</li>
   <li data-complete={evidence.sandboxCreated}>{evidence.sandboxCreated?'Observed':'Not observed'} · TrueForge sandbox provisioned</li>
   <li data-complete={evidence.sandboxToolResponse}>{evidence.sandboxToolResponse?'Observed':'Not observed'} · sandbox or Code Mode tool response</li>
   <li data-complete={evidence.approvalPaused}>{evidence.approvalPaused?'Observed':'Not requested in this run'} · human approval pause for a gated action</li>
  </ul><p>A request or enabled setting is not execution evidence. Only events from this TrueForge session count.</p></div>}
  {events.length>0&&<div className="agent-stream"><h3>TrueForge event stream</h3><ol>{events.map((event,index)=><li key={`${index}-${event}`}>{event}</li>)}</ol>{answer&&<div className="agent-answer"><h3>Agent report</h3><pre>{answer}</pre></div>}</div>}
 </section>
}
