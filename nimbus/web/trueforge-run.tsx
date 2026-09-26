import {useState} from 'react';
import {TrueForge,TrueForgeApi,isEventDelta,mergeEventDelta} from '@truefoundry/trueforge-sdk';

type Approval={threadId:string;toolCallId:string;toolName:string;argumentsText:string};
type EventIndex=Map<string,TrueForgeApi.TurnStreamingEvent>;
type ToolCallEvidence={type:string;name:string};
type HarnessEvidence={mcpToolResponse:boolean;sandboxCreated:boolean;sandboxToolResponse:boolean;approvalPaused:boolean};

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
 const [prompt,setPrompt]=useState('Inspect my configured AWS account in the configured region using the Nimbus MCP tools. Read current inventory, monthly service costs, and recent daily service costs. Use the TrueForge sandbox to run a deterministic script that summarizes the returned evidence and creates a Markdown report. Clearly state pagination limits, Cost Explorer freshness, service-level attribution limits, and missing utilization data. Do not call or propose mark_volume_for_review unless I separately ask to tag a specific volume. Never delete, stop, snapshot, or change any AWS resource.');
 const [events,setEvents]=useState<string[]>([]);
 const [answer,setAnswer]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [sessionId,setSessionId]=useState('');
 const [pending,setPending]=useState<Approval[]>([]);
 const [evidence,setEvidence]=useState<HarnessEvidence>({mcpToolResponse:false,sandboxCreated:false,sandboxToolResponse:false,approvalPaused:false});

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
  setBusy(true);setEvents([]);setAnswer('');setPending([]);setError('');setSessionId('');setEvidence({mcpToolResponse:false,sandboxCreated:false,sandboxToolResponse:false,approvalPaused:false});
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
  <div className="live-head"><div><span className="small-label">TRUEFORGE SDK · LIVE SESSION · HUMAN CHECKPOINT</span><h2 id="trueforge-run-title">Run the Nimbus agent</h2><p>This starts the saved <code>nimbus-cost-agent</code> in TrueForge. Tool calls and sandbox events come from its actual event stream. The one AWS write is an explicit, reversible review tag and waits here for your decision.</p></div><a href="http://localhost:8790" target="_blank" rel="noopener noreferrer">Open TrueForge ↗</a></div>
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
   <li data-complete={evidence.sandboxCreated}>{evidence.sandboxCreated?'Observed':'Not observed'} · TrueForge sandbox provisioned</li>
   <li data-complete={evidence.sandboxToolResponse}>{evidence.sandboxToolResponse?'Observed':'Not observed'} · sandbox or Code Mode tool response</li>
   <li data-complete={evidence.approvalPaused}>{evidence.approvalPaused?'Observed':'Not requested in this run'} · human approval pause for a gated action</li>
  </ul><p>A request or enabled setting is not execution evidence. Only events from this TrueForge session count.</p></div>}
  {events.length>0&&<div className="agent-stream"><h3>TrueForge event stream</h3><ol>{events.map((event,index)=><li key={`${index}-${event}`}>{event}</li>)}</ol>{answer&&<div className="agent-answer"><h3>Agent report</h3><pre>{answer}</pre></div>}</div>}
 </section>
}
