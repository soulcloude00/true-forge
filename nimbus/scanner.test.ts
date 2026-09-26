import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './fixture.ts';
import {scan} from './scanner.ts';

test('fixture yields five traced, priced findings in descending order',()=>{
  const found=scan(fixture);
  assert.equal(found.length,5);
  assert.deepEqual(new Set(found.map(f=>f.kind)),new Set(['volume','ipv4','instance','load-balancer','snapshot']));
  assert.ok(found.every(f=>f.evidence.length && f.estimatedMonthlyUsd>0 && f.region==='us-east-1'));
  assert.ok(found.every((f,j)=>j===0 || found[j-1].estimatedMonthlyUsd>=f.estimatedMonthlyUsd));
  assert.equal(found.filter(f=>f.eligibleForAction).length,1);
});
test('no idle server claim without a complete metric window',()=>{
  const inventory=structuredClone(fixture) as any;
  inventory.metrics['i-0idle'].cpuDailyPercent=[1];
  assert.ok(!scan(inventory).some(f=>f.resourceId==='i-0idle'));
});
test('activity and recent resources do not flag',()=>{
  const inventory=structuredClone(fixture) as any;
  inventory.volumes.Volumes[0].CreateTime='2026-09-24T00:00:00Z';
  inventory.addresses.Addresses[0].AssociationId='eipassoc-999';
  inventory.metrics.idle.requestCountDaily[0]=10;
  assert.ok(!scan(inventory).some(f=>['vol-0a11ce','eipalloc-0a11ce',inventory.loadBalancers.LoadBalancers[0].LoadBalancerArn].includes(f.resourceId)));
});
test('tag alone never authorizes destructive finding',()=>{
  assert.ok(scan(fixture).filter(f=>['volume','instance','snapshot','load-balancer'].includes(f.kind)).every(f=>!f.eligibleForAction));
});

test('active signals suppress three suspect leads in the synthetic variant',async()=>{
  const {inventoryFor}=await import('./web/scenarios.ts');
  const found=scan(inventoryFor('active'));
  assert.deepEqual(new Set(found.map(f=>f.kind)),new Set(['ipv4','snapshot']));
});
test('missing metrics suppress idle claims rather than guessing',async()=>{
  const {inventoryFor}=await import('./web/scenarios.ts');
  const found=scan(inventoryFor('incomplete'));
  assert.deepEqual(new Set(found.map(f=>f.kind)),new Set(['volume','ipv4','snapshot']));
});

test('audit accounts for each resource and identifies included versus excluded',async()=>{
  const {auditInventory}=await import('./web/audit.ts');
  const result=auditInventory(fixture,scan(fixture));
  assert.equal(result.length,8);
  assert.equal(result.filter(x=>x.status==='flagged').length,5);
  assert.ok(result.find(x=>x.resourceId==='i-0active')?.why.includes('activity'));
});

test('review plan separates estimates from decisions and adds manual safeguards',async()=>{
  const {reviewPlan,planMarkdown}=await import('./web/plan.ts');
  const findings=scan(fixture);
  const decisions={[findings[0].id]:'approved',[findings[1].id]:'kept'} as const;
  const plan=reviewPlan(findings,decisions);
  assert.equal(plan.approved.length,1);
  assert.equal(plan.denied.length,1);
  assert.equal(plan.open.length,3);
  assert.equal(plan.estimatedMonthlyApproved,findings[0].estimatedMonthlyUsd);
  assert.ok(planMarkdown(findings,decisions,{},'baseline').includes('Get separate approval'));
});

import {parseInventory} from './web/import.ts';
import {fixture as webFixture} from './web/fixture.ts';
test('local JSON parser accepts synthetic fixture and reproduces five findings',()=>{
  const parsed=parseInventory(JSON.parse(JSON.stringify(webFixture)));
  assert.equal(scan(parsed).length,5);
});
test('local JSON parser rejects malformed metrics, missing collections and bad rates',()=>{
  assert.throws(()=>parseInventory({capturedAt:'2026-09-01',region:'us-east-1'}));
  const bad=JSON.parse(JSON.stringify(webFixture));bad.metrics['i-0idle'].cpuDailyPercent=[1,'oops'];
  assert.throws(()=>parseInventory(bad),/Metrics/);
  bad.metrics['i-0idle'].cpuDailyPercent=[1,2];bad.rates.albHour=-1;
  assert.throws(()=>parseInventory(bad),/rates|assumptions/i);
});

import {explainEstimate} from './web/estimate.ts';
test('estimate breakdown names the input rate and caveat for each rule',()=>{
 const results=scan(webFixture);
 assert.equal(results.length,5);
 for(const result of results){const d=explainEstimate(result,webFixture);assert.ok(d.formula.includes('× $'));assert.ok(d.assumption.length>20);assert.ok(d.coverage.length>15)}
 assert.match(explainEstimate(results.find(f=>f.kind==='snapshot')!,webFixture).assumption,/changed blocks/);
});

import {ruleCoverage} from './web/coverage.ts';
test('coverage flags incomplete windows without treating eligible fields as safe resources',async()=>{
 const base=ruleCoverage(webFixture);
 assert.equal(base.find(x=>x.rule==='EC2 utilization')?.blocked,0);
 const missing=ruleCoverage((await import('./web/scenarios.ts')).inventoryFor('incomplete'));
 assert.ok(missing.find(x=>x.rule==='EC2 utilization')!.blocked>0);
 assert.ok(missing.find(x=>x.rule==='Load balancer traffic')!.blocked>0);
});

test('unknown instance type is not priced with t3.medium rate',async()=>{
 const inventory=structuredClone(webFixture);
 inventory.instances.Reservations[0].Instances[0].InstanceType='m7i.large';
 const found=scan(inventory);
 assert.ok(!found.some(f=>f.resourceId==='i-0idle'));
 const {auditInventory}=await import('./web/audit.ts');
 assert.match(auditInventory(inventory,found).find(x=>x.resourceId==='i-0idle')!.why,/No supplied rate/);
 assert.equal(ruleCoverage(inventory).find(x=>x.rule==='EC2 utilization')!.blocked,1);
});


test('non-gp3 volumes and nonstandard snapshots cannot borrow mismatched input rates',async()=>{
 const i=structuredClone(webFixture);
 i.volumes.Volumes[0].VolumeType='io2';
 i.snapshots.Snapshots[0].StorageTier='archive';
 const found=scan(i);
 assert.ok(!found.some(f=>f.resourceId==='vol-0a11ce'||f.resourceId==='snap-0a11ce'));
 const {auditInventory}=await import('./web/audit.ts');
 const audit=auditInventory(i,found);
 assert.match(audit.find(x=>x.resourceId==='vol-0a11ce')!.why,/No matching gp3 rate/);
 assert.match(audit.find(x=>x.resourceId==='snap-0a11ce')!.why,/No matching standard-tier/);
 const coverage=ruleCoverage(i);
 assert.equal(coverage.find(x=>x.rule==='EBS storage')!.blocked,1);
 assert.equal(coverage.find(x=>x.rule==='Snapshot age')!.blocked,1);
});


test('full audit CSV includes excluded resources and neutralizes spreadsheet formulas',async()=>{
 const {auditCsv}=await import('./web/audit-export.ts');
 const {auditInventory}=await import('./web/audit.ts');
 const rows=auditInventory(webFixture,scan(webFixture));
 assert.equal(auditCsv(rows,'Synthetic fixture').split('\r\n').length,9);
 assert.match(auditCsv(rows,'Synthetic fixture'),/"i-0active","EC2 instance","not flagged"/);
 assert.match(auditCsv([{resourceId:'=1+1',service:'EC2',status:'not flagged',why:'\n@SUM(1)'}],'+origin'),/"'\+origin","'=1\+1"/);
});


test('audit search and status include excluded reasons without changing exported rows',async()=>{
 const {filterAudit}=await import('./web/audit-filter.ts');
 const {auditInventory}=await import('./web/audit.ts');
 const rows=auditInventory(webFixture,scan(webFixture));
 assert.equal(filterAudit(rows,'', 'not flagged').length,3);
 assert.deepEqual(filterAudit(rows,'i-0active','all').map(x=>x.resourceId),['i-0active']);
 assert.deepEqual(filterAudit(rows,'ACTIVE','flagged'),[]);
 assert.equal(filterAudit(rows,'  attached  ','not flagged').length,1);
 assert.equal(rows.length,8);
});


test('synthetic scenario comparison runs the same scanner on each independent fixture',async()=>{
 const {compareScenarios}=await import('./web/compare.ts');
 const rows=compareScenarios();
 assert.deepEqual(rows.map(r=>r.count),[5,2,3,0]);
 assert.ok(rows.every(r=>r.monthlyCandidateUsd>=0&&r.resourceIds.length===r.count));
 assert.ok(rows[0].monthlyCandidateUsd>rows[1].monthlyCandidateUsd);
});


test('clean synthetic inventory produces no candidate, while audit retains every exclusion',async()=>{
 const {inventoryFor}=await import('./web/scenarios.ts');
 const {auditInventory}=await import('./web/audit.ts');
 const inventory=inventoryFor('none');
 assert.equal(scan(inventory).length,0);
 assert.equal(auditInventory(inventory,[]).length,8);
 assert.ok(auditInventory(inventory,[]).every(row=>row.status==='not flagged'));
});


test('rule caution filter and sort do not conflate risk with estimate',async()=>{
 const {triageFindings,ruleRisk}=await import('./web/triage.ts');
 const found=scan(webFixture);
 assert.equal(triageFindings(found,'critical','risk').length,1);
 assert.equal(triageFindings(found,'high','risk').length,3);
 assert.equal(triageFindings(found,'medium','risk').length,1);
 assert.equal(ruleRisk(triageFindings(found,'all','risk')[0]),'critical');
 assert.equal(found.length,5);
});

test('volume finding does not infer attachment history from creation time',()=>{
 const text=scan(webFixture).find(f=>f.kind==='volume')!.explanation;
 assert.match(text,/created .* days ago and is unattached in this input/);
 assert.match(text,/attachment history is unknown/);
});


test('findings CSV cell neutralizes formula-like imported resource IDs and notes',async()=>{
 const {safeCsvCell}=await import('./web/audit-export.ts');
 assert.equal(safeCsvCell('=1+1'),`"'=1+1"`);
 assert.equal(safeCsvCell('  @SUM(1)'),`"'  @SUM(1)"`);
 assert.equal(safeCsvCell('hello,"world"'),`"hello,""world"""`);
});


test('input health shows age, undated metrics, zero rates and duplicate IDs without claiming live verification',async()=>{
 const {inputHealth}=await import('./web/input-health.ts');
 const current=inputHealth(webFixture,'2026-09-26T12:00:00Z');
 assert.equal(current.level,'fresh');assert.equal(current.ageDays,1);assert.match(current.warnings.join(' '),/undated arrays/);
 const i=structuredClone(webFixture); i.rates.gp3GbMonth=0;i.volumes.Volumes[1].VolumeId=i.volumes.Volumes[0].VolumeId;
 const old=inputHealth(i,'2026-11-01T12:00:00Z');assert.equal(old.level,'old');assert.match(old.warnings.join(' '),/Duplicate/);assert.match(old.rateWarnings.join(' '),/gp3GbMonth/);
 assert.equal(inputHealth(i,'2026-09-01T12:00:00Z').level,'future');
});


test('absent attachment list or snapshot source ID suppresses destructive leads',async()=>{
 const i=structuredClone(webFixture);
 delete (i.volumes.Volumes[0] as {Attachments?:unknown[]}).Attachments;
 delete (i.snapshots.Snapshots[0] as {VolumeId?:string}).VolumeId;
 const {scan:scanWeb}=await import('./web/scanner.ts');
 const found=scanWeb(i);
 assert.ok(!found.some(f=>f.kind==='volume'||f.kind==='snapshot'));
 const {auditInventory}=await import('./web/audit.ts');
 const audit=auditInventory(i,found);
 assert.match(audit.find(r=>r.resourceId===i.volumes.Volumes[0].VolumeId)!.why,/Attachment data missing/);
 assert.match(audit.find(r=>r.resourceId===i.snapshots.Snapshots[0].SnapshotId)!.why,/Source volume ID missing/);
 const coverage=ruleCoverage(i);
 assert.equal(coverage.find(x=>x.rule==='EBS storage')!.blocked,1);
 assert.equal(coverage.find(x=>x.rule==='Snapshot age')!.blocked,1);
});


test('tag candidate grouping retains untagged leads and never labels total spend',async()=>{
 const {candidateTags,candidateAllocation}=await import('./web/allocation.ts');
 const i=structuredClone(webFixture);i.volumes.Volumes[0].Tags=[{Key:'team',Value:'platform'}];
 assert.ok(candidateTags(i).includes('team'));
 const rows=candidateAllocation(i,(await import('./web/scanner.ts')).scan(i),'team');
 assert.equal(rows.reduce((n,x)=>n+x.count,0),5);
 assert.equal(rows.find(x=>x.value==='platform')!.count,1);
 assert.equal(rows.find(x=>x.value==='Untagged / unavailable')!.count,4);
 assert.equal(Math.round(rows.reduce((n,x)=>n+x.estimatedMonthlyUsd,0)*100)/100,62.45);
});


test('local plan gates flag only approved threshold and critical caution, without cloud actions',async()=>{
 const {reviewGates}=await import('./web/review-gate.ts');
 const f=(await import('./web/scanner.ts')).scan(webFixture);
 const decisions=Object.fromEntries(f.map(x=>[x.id,'approved'])) as Record<string,'approved'>;
 const gates=reviewGates(f,decisions,20);
 assert.deepEqual(gates.map(x=>x.resourceId).sort(),['i-0idle','snap-0a11ce']);
 assert.match(gates.find(x=>x.resourceId==='snap-0a11ce')!.reasons.join(' '),/Critical/);
 delete decisions[f.find(x=>x.kind==='snapshot')!.id];
 assert.equal(reviewGates(f,decisions,100).length,0);
});


test('pasted duplicate resource IDs are rejected before audit and decision matching',()=>{
 const i=structuredClone(webFixture);
 i.volumes.Volumes[1].VolumeId=i.volumes.Volumes[0].VolumeId;
 assert.throws(()=>parseInventory(i),/Duplicate resource identifiers/);
 const j=structuredClone(webFixture);
 j.snapshots.Snapshots[0].SnapshotId=j.volumes.Volumes[0].VolumeId;
 assert.throws(()=>parseInventory(j),/Duplicate resource identifiers/);
});


test('review queue places critical first and excludes decided findings',async()=>{
 const {reviewPriority}=await import('./web/review-priority.ts');
 const f=(await import('./web/scanner.ts')).scan(webFixture);
 const queue=reviewPriority(f,{});
 assert.equal(queue.length,5);assert.equal(queue[0].kind,'snapshot');
 const decisions={[queue[0].id]:'kept'} as Record<string,'kept'>;
 assert.equal(reviewPriority(f,decisions).length,4);
 assert.ok(reviewPriority(f,decisions).every(x=>x.kind!=='snapshot'));
});


test('rate sensitivity reprices same fixture leads without changing original inventory',async()=>{
 const {rateSensitivity}=await import('./web/rate-sensitivity.ts');
 const i=structuredClone(webFixture),before=JSON.stringify(i);
 const base=rateSensitivity(i,1),high=rateSensitivity(i,1.2);
 assert.equal(base.baseMonthlyUsd,62.45);assert.equal(base.scenarioMonthlyUsd,62.45);
 assert.equal(high.scenarioCount,5);assert.ok(high.scenarioMonthlyUsd>base.baseMonthlyUsd);
 assert.equal(JSON.stringify(i),before);
 assert.throws(()=>rateSensitivity(i,4),/between 0 and 3/);
});


test('tag quality counts all resource records and untagged candidate estimates',async()=>{
 const {auditTag}=await import('./web/tag-audit.ts');
 const f=(await import('./web/scanner.ts')).scan(webFixture);
 const q=auditTag(webFixture,f,'janitor:managed');
 assert.equal(q.present,3);assert.equal(q.total,8);
 assert.equal(q.candidateEstimateUsd,20.43);
 assert.ok(q.missingIds.includes('snap-0a11ce'));
});


test('pasted resource future dates reject misleading age-based findings',()=>{
 const i=structuredClone(webFixture);i.volumes.Volumes[0].CreateTime='2026-11-01T00:00:00Z';
 assert.throws(()=>parseInventory(i),/later than inventory capture/);
 const j=structuredClone(webFixture);j.snapshots.Snapshots[0].StartTime='2026-10-01T00:00:00Z';
 assert.throws(()=>parseInventory(j),/later than inventory capture/);
});


test('two local inventories report added and cleared scan leads without changing either input',async()=>{
 const {inventoryDiff}=await import('./web/inventory-diff.ts');
 const {inventoryFor}=await import('./web/scenarios.ts');
 const base=inventoryFor('baseline'),active=inventoryFor('active');
 const before=JSON.stringify(base),after=JSON.stringify(active);
 const diff=inventoryDiff(base,active);
 assert.equal(diff.previousCount,5);assert.equal(diff.currentCount,2);
 assert.equal(diff.cleared.length,3);assert.equal(diff.added.length,0);assert.equal(diff.shared.length,2);
 assert.equal(JSON.stringify(base),before);assert.equal(JSON.stringify(active),after);
});


test('local inventory comparison blocks different stated accounts or regions',async()=>{
 const {inventoryDiff}=await import('./web/inventory-diff.ts');
 const a=structuredClone(webFixture),b=structuredClone(webFixture);b.region='eu-west-1';
 assert.throws(()=>inventoryDiff(a,b),/Regions differ/);
 b.region=a.region;b.accountId='123456789012';
 assert.throws(()=>inventoryDiff(a,b),/Account labels differ/);
});


test('local comparison JSON handoff discloses only finding IDs and explicit caveats',async()=>{
 const {inventoryDiffReport}=await import('./web/inventory-diff.ts');
 const {inventoryFor}=await import('./web/scenarios.ts');
 const report=JSON.parse(inventoryDiffReport(inventoryFor('active'),inventoryFor('baseline')));
 assert.equal(report.addedIds.length,3);
 assert.equal(report.reference.region,'us-east-1');
 assert.match(report.caveat,/not a measured bill change/);
 assert.equal(report.reference.rates,undefined);
 assert.equal(report.current.metrics,undefined);
});


test('self-marked checklist counts only recognized prompts and never invents verification',async()=>{
 const {checklistProgress,reviewChecks}=await import('./web/checklist.ts');
 const found=(await import('./web/scanner.ts')).scan(webFixture);
 assert.equal(reviewChecks.length,5);
 const first=found[0].id;
 assert.deepEqual(checklistProgress(found,{}),{done:0,total:25,complete:0});
 const checked=Object.fromEntries([[first,reviewChecks.map(c=>c.id)]]);
 assert.deepEqual(checklistProgress(found,checked),{done:5,total:25,complete:1});
});

test('local investigation stage filters separately from cloud approval',async()=>{
 const {stageCounts,filterByStage}=await import('./web/review-stage.ts');
 const found=(await import('./web/scanner.ts')).scan(webFixture);
 const stages:{[id:string]:'investigating'}={[found[0].id]:'investigating'};
 assert.deepEqual(stageCounts(found,stages),{new:4,investigating:1,'on-hold':0});
 assert.equal(filterByStage(found,stages,'investigating')[0].id,found[0].id);
 assert.equal(filterByStage(found,stages,'on-hold').length,0);
});

test('review CSV includes local stage and checklist count with formula-safe notes',async()=>{
 const {findingsCsv}=await import('./web/findings-export.ts');
 const found=(await import('./web/scanner.ts')).scan(webFixture);
 const first=found[0];
 const csv=findingsCsv(found,{[first.id]:'approved'},{[first.id]:'=SUM(A1)'},{[first.id]:'investigating'},{[first.id]:['owner','bill']},'synthetic sample');
 assert.match(csv,/"investigationStage","selfMarkedPromptCount"/);
 assert.match(csv,/"investigating","2","'=SUM\(A1\)"/);
});

test('local review snapshot roundtrips only on the matching scan',async()=>{
 const {reviewSession,restoreReviewSession}=await import('./web/review-session.ts');
 const found=(await import('./web/scanner.ts')).scan(webFixture);
 const first=found[0].id;
 const state={decisions:{[first]:'approved' as const},notes:{[first]:'Owner to confirm'},stages:{[first]:'investigating' as const},checked:{[first]:['owner' as const]}};
 const snapshot=reviewSession(webFixture,found,state);
 assert.deepEqual(restoreReviewSession(snapshot,webFixture,found),state);
 assert.throws(()=>restoreReviewSession(snapshot,{...webFixture,region:'eu-west-1'},found),/does not match/);
 assert.throws(()=>restoreReviewSession(snapshot,{...webFixture,rates:{...webFixture.rates,gp3GbMonth:0.09}},found),/does not match/);
 assert.throws(()=>restoreReviewSession(snapshot.replace('"owner"','"not-a-check"'),webFixture,found),/Invalid checked/);
});

test('two-inventory reconciliation separates new, cleared and continuing estimate changes',async()=>{
 const {diffAnalysis}=await import('./web/diff-analysis.ts');
 const reference=structuredClone(webFixture);
 const current=structuredClone(webFixture);
 current.rates.gp3GbMonth=0.1;
 current.addresses.Addresses[0].AssociationId='assoc-new';
 const result=diffAnalysis(reference,current);
 assert.equal(result.rateChanges.includes('gp3GbMonth'),true);
 assert.equal(result.chronology,'same');
 assert.equal(result.clearedUsd,3.65);
 assert.equal(result.continuingDeltaUsd,2);
 assert.equal(result.reconciledDeltaUsd,result.reportedDeltaUsd);
});

test('full-audit next-evidence guidance distinguishes missing inputs from safety',async()=>{
 const {auditInventory}=await import('./web/audit.ts');
 const {nextEvidence,auditGaps}=await import('./web/audit-next.ts');
 const {scan}=await import('./web/scanner.ts');
 const copy=structuredClone(webFixture);
 copy.metrics['i-0active'].cpuDailyPercent=[];
 const rows=auditInventory(copy,scan(copy));
 assert.match(nextEvidence(rows.find(r=>r.resourceId==='i-0active')!),/14 daily CPU and network/);
 assert.ok(auditGaps(rows).missingIds.includes('i-0active'));
 assert.match(nextEvidence(rows.find(r=>r.resourceId==='vol-0a11ce')!),/Open the finding/);
});

test('resource metric strips show only supplied complete samples',async()=>{
 const {metricEvidence}=await import('./web/metric-evidence.ts');
 const {scan}=await import('./web/scanner.ts');
 const found=scan(webFixture);
 const ec2=found.find(f=>f.kind==='instance')!;
 assert.deepEqual(metricEvidence(ec2,webFixture).map(x=>x.values.length),[14,14]);
 const lb=found.find(f=>f.kind==='load-balancer')!;
 assert.deepEqual(metricEvidence(lb,webFixture).map(x=>x.values.length),[14]);
 assert.equal(metricEvidence(found.find(f=>f.kind==='volume')!,webFixture).length,0);
});

test('one-rate what-if changes only linked estimates, not source inventory',async()=>{
 const {rateLab}=await import('./web/rate-lab.ts');
 const base=webFixture.rates.gp3GbMonth;
 const result=rateLab(webFixture,'gp3GbMonth',base*2);
 assert.equal(result.rows.length,1);
 assert.equal(result.rows[0].kind,'volume');
 assert.equal(result.deltaUsd,8);
 assert.equal(webFixture.rates.gp3GbMonth,base);
 assert.throws(()=>rateLab(webFixture,'gp3GbMonth',-1),/nonnegative/);
});

test('local comparison is invalidated when current inventory changes',async()=>{
 const {comparisonFingerprint,verifiedComparison}=await import('./web/comparison-state.ts');
 const stamp=comparisonFingerprint(webFixture);
 assert.equal(verifiedComparison(webFixture,webFixture,stamp)?.currentCount,5);
 const changed=structuredClone(webFixture);
 changed.rates.gp3GbMonth+=0.01;
 assert.equal(verifiedComparison(webFixture,changed,stamp),null);
});
