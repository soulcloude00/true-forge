import type {AuditRow} from './audit.ts';
/** Missing evidence for excluded records; not a recommendation to modify a cloud resource. */
export function nextEvidence(row:AuditRow):string{
 if(row.status==='flagged')return 'Open the finding for rule evidence, ownership questions, and risk before any decision.';
 if(row.service==='EBS volume')return row.why.includes('Attachment data missing')?'Supply the attachment list and verify owner and contents.':row.why.includes('No matching gp3 rate')?'Supply a supported storage rate before estimating cost.':'Confirm current attachment, owner and data-retention needs if reviewing this disk.';
 if(row.service==='Public IPv4')return 'Check current association, DNS and cutover plans before drawing any conclusion.';
 if(row.service==='EC2 instance')return row.why.includes('Missing a complete')?'Supply 14 daily CPU and network samples, then check jobs and owner.':row.why.includes('No supplied rate')?'Supply a matching instance rate and utilization history.':'Confirm current utilization, scheduled jobs and owner.';
 if(row.service==='Load balancer')return row.why.includes('Missing a complete')?'Supply 14 daily request counts and healthy-target count.':'Check current listeners, target groups, DNS and owner.';
 if(row.service==='Snapshot')return row.why.includes('Source volume ID missing')?'Supply the source volume ID and check backup policy.':row.why.includes('No matching')?'Supply a matching storage-tier rate and retention policy.':'Verify backup retention and restore references.';
 return 'Inspect this input record and confirm live state separately.';
}
export function auditGaps(rows:AuditRow[]){
 const excluded=rows.filter(r=>r.status==='not flagged');
 const missing=excluded.filter(r=>/missing|Missing|No matching|No eligible/.test(r.why));
 return {excluded:excluded.length,missingEvidence:missing.length,missingIds:missing.map(r=>r.resourceId)};
}
