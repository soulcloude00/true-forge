import {useState} from 'react';

type Resource={id:string;type?:string;state?:string;sizeGiB?:number;attached?:number;allocationId?:string|null;ip?:string;associated?:boolean;arn?:string;name?:string;sourceVolumeId?:string|null};
type Report={source:string;region:string;accountId:string;capturedAt:string;counts:Record<string,number>;coverage:{maxPagesPerService:number;truncatedServices:string[]};resources:Record<string,Resource[]>;warning:string};
type Costs={source:string;month:string;services:Array<{service:string;amount:string;unit:string}>;coverage:{maxPages:number;truncated:boolean};warning:string};
async function callTool<T>(name:string,args:Record<string,string>):Promise<T>{
 const init=await fetch('/api/live-aws/mcp',{method:'POST',headers:{'content-type':'application/json','accept':'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'nimbus-live-panel',version:'0.1.0'}}})});
 if(!init.ok)throw new Error(`MCP initialize returned HTTP ${init.status}`);
 const sid=init.headers.get('mcp-session-id');
 const initialized=await fetch('/api/live-aws/mcp',{method:'POST',headers:{'content-type':'application/json','accept':'application/json, text/event-stream',...(sid?{'mcp-session-id':sid}:{})},body:JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized',params:{}})});
 if(!initialized.ok)throw new Error(`MCP session setup returned HTTP ${initialized.status}`);
 const response=await fetch('/api/live-aws/mcp',{method:'POST',headers:{'content-type':'application/json','accept':'application/json, text/event-stream',...(sid?{'mcp-session-id':sid}:{})},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/call',params:{name,arguments:args}})});
 if(!response.ok)throw new Error(`AWS connector returned HTTP ${response.status}`);
 const raw=await response.text();
 const body=JSON.parse(raw.startsWith('data:')?raw.split('data:').filter(Boolean).at(-1)!.trim():raw);
 if(body.error)throw new Error(body.error.message||'MCP request failed');
 const result=body.result;
 if(result.isError)throw new Error(result.content?.map((part:{text?:string})=>part.text).join('\n')||'AWS request failed');
 const text=result.content?.find((part:{type:string})=>part.type==='text')?.text;
 if(!text)throw new Error('AWS connector returned no report');
 return JSON.parse(text) as T;
}

export function LiveEvidence(){
 const [region,setRegion]=useState('us-east-1');
 const [month,setMonth]=useState(new Date().toISOString().slice(0,7));
 const [report,setReport]=useState<Report|null>(null);
 const [costs,setCosts]=useState<Costs|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const load=async()=>{setBusy(true);setError('');setReport(null);setCosts(null);try{const [inventory,billing]=await Promise.all([callTool<Report>('inspect_aws_inventory',{region}),callTool<Costs>('read_monthly_service_cost',{month})]);setReport(inventory);setCosts(billing)}catch(e){setError(e instanceof Error?e.message:'Could not read live AWS evidence.')}finally{setBusy(false)}};
 const total=costs?.services.reduce((sum,item)=>sum+(Number(item.amount)||0),0)??0;
 const units=[...new Set(costs?.services.map(item=>item.unit).filter(Boolean)||[])];
 const totalLabel=units.length===1&&/^[A-Z]{3}$/.test(units[0])?new Intl.NumberFormat('en-US',{style:'currency',currency:units[0]}).format(total):`${total.toFixed(2)} ${units.join('/')||'unit unavailable'}`;
 return <section className="live-evidence" aria-labelledby="live-evidence-title">
  <div className="live-head"><div><span className="small-label">LIVE AWS · READ ONLY · TRUEFORGE MCP</span><h2 id="live-evidence-title">Account evidence</h2><p>This panel calls the local Nimbus MCP server. These live records are not the synthetic scanner findings or verified savings.</p></div><a href="http://localhost:8790" target="_blank" rel="noopener noreferrer">Open TrueForge ↗</a></div>
  <form className="live-controls" onSubmit={event=>{event.preventDefault();void load()}}><label>Region<input value={region} onChange={event=>setRegion(event.target.value)} pattern="[a-z]{2}-[a-z-]+-[0-9]" required/></label><label>Cost month<input type="month" value={month} onChange={event=>setMonth(event.target.value)} required/></label><button disabled={busy}>{busy?'Reading AWS…':'Inspect with TrueForge MCP'}</button></form>
  {error&&<div role="alert" className="live-error"><strong>Live read failed</strong><p>{error}</p><span>Start `npm run mcp`, configure local AWS credentials, and keep Nimbus on this laptop.</span></div>}
  {report&&costs&&<div className="live-report"><div className="live-meta"><span><b>Account</b>{report.accountId}</span><span><b>Region</b>{report.region}</span><span><b>Captured</b>{new Date(report.capturedAt).toLocaleString()}</span><span><b>Service cost · {costs.month}</b>{totalLabel}{costs.coverage.truncated?' · partial':''}</span></div>
   <div className="live-counts">{Object.entries(report.counts).map(([key,value])=><div key={key}><strong>{value}</strong><span>{key.replace(/[A-Z]/g,' $&').toLowerCase()}</span></div>)}</div>
   {report.coverage.truncatedServices.length>0&&<p className="live-warning">Inventory stopped at {report.coverage.maxPagesPerService} pages for: {report.coverage.truncatedServices.join(', ')}.</p>}
   <p className="live-warning">{report.warning}</p><p className="live-warning">{costs.warning}</p>
   <details><summary>Resource records returned</summary>{Object.entries(report.resources).map(([kind,items])=><section className="live-resource-group" key={kind}><h3>{kind} <span>{items.length}</span></h3>{items.length===0?<p>No records returned.</p>:<ul>{items.map((item,index)=><li key={item.id||item.arn||item.allocationId||`${kind}-${index}`}><code>{item.id||item.arn||item.allocationId||item.name||'Unknown resource'}</code><span>{[item.type,item.state,item.sizeGiB!==undefined?`${item.sizeGiB} GiB`:null].filter(Boolean).join(' · ')}</span></li>)}</ul>}</section>)}</details>
   <details><summary>Monthly cost by AWS service</summary><ul>{costs.services.map(item=><li key={item.service}><span>{item.service}</span><strong>{item.unit} {Number(item.amount).toFixed(2)}</strong></li>)}</ul></details>
  </div>}
 </section>
}
