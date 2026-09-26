import {useState} from 'react';
import {TrueForge} from '@truefoundry/trueforge-sdk';

type StreamEvent={type?:string;content?:string;tool_calls?:Array<{name?:string;tool_name?:string}>;data?:StreamEvent};
const eventLabel=(event:StreamEvent)=>{
 if(event.type==='sandbox.created')return 'Sandbox created';
 if(event.type==='tool.approval_required')return 'Waiting for tool approval in TrueForge';
 if(event.type==='tool.response_required')return 'TrueForge is requesting a tool response';
 if(event.type==='mcp.initialize')return 'MCP tools connected';
 if(event.type==='turn.done')return 'Turn finished';
 if(event.type==='turn.created')return 'Turn started';
 if(event.type?.startsWith('tool.'))return `Tool event · ${event.type}`;
 if(event.type?.startsWith('model.message'))return 'Agent response';
 return event.type||'Agent event';
};

export function TrueForgeRun(){
 const [prompt,setPrompt]=useState('Inspect my configured AWS account in the configured region using the Nimbus read-only MCP tools. Then use the sandbox to run a small deterministic script that summarizes the returned inventory, validates the account/region/capture metadata, and creates a Markdown evidence report. Clearly state pagination limits and missing utilization data. Do not claim savings, infer idleness, or change AWS resources.');
 const [events,setEvents]=useState<string[]>([]);
 const [answer,setAnswer]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const run=async()=>{
  setBusy(true);setEvents([]);setAnswer('');setError('');
  try{
   const client=new TrueForge({baseUrl:`${window.location.origin}/api/trueforge`,timeoutInSeconds:600});
   const {data:session}=await client.sessions.create({agent:{name:'nimbus-cost-agent'}});
   const stream=await client.sessions.createTurnStream(session.id,{input:[{type:'user.message',content:prompt}]});
   for await(const raw of stream){
    const candidate=raw as StreamEvent;
    const event=candidate.data&&typeof candidate.data==='object'?candidate.data:candidate;
    if(event.type==='model.message.delta'&&typeof event.content==='string')setAnswer(current=>current+event.content);
    const tools=event.tool_calls?.map(tool=>tool.name||tool.tool_name).filter(Boolean);
    setEvents(current=>[...current,tools?.length?`${eventLabel(event)} · ${tools.join(', ')}`:eventLabel(event)]);
   }
  }catch(e){setError(e instanceof Error?e.message:'TrueForge turn could not be completed.');}
  finally{setBusy(false)}
 };
 return <section className="trueforge-run" aria-labelledby="trueforge-run-title">
  <div className="live-head"><div><span className="small-label">TRUEFORGE SDK · SESSION + EVENT STREAM</span><h2 id="trueforge-run-title">Run the Nimbus agent</h2><p>This creates a session with `nimbus-cost-agent`. The agent reads through its configured MCP tools and can use its configured sandbox; its actual TrueForge events are shown here.</p></div></div>
  <label className="agent-prompt-label">Investigation request<textarea value={prompt} onChange={event=>setPrompt(event.target.value)} rows={4} disabled={busy}/></label>
  <button className="agent-run-button" onClick={()=>void run()} disabled={busy||!prompt.trim()}>{busy?'Running in TrueForge…':'Start TrueForge investigation'}</button>
  {error&&<div role="alert" className="live-error"><strong>TrueForge request failed</strong><p>{error}</p><span>Confirm TrueForge is running at localhost:8790 and that the saved agent, model, connector, and sandbox are configured.</span></div>}
  {events.length>0&&<div className="agent-stream"><h3>Harness events</h3><ol>{events.map((event,index)=><li key={`${index}-${event}`}>{event}</li>)}</ol>{answer&&<div className="agent-answer"><h3>Agent response</h3><pre>{answer}</pre></div>}</div>}
 </section>
}
