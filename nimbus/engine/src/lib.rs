//! Pure read-only waste detection. No AWS clients, credentials, approvals or mutation calls.
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Finding {
    pub id: String,
    pub resource_id: String,
    pub region: String,
    pub kind: String,
    pub title: String,
    pub explanation: String,
    pub estimated_monthly_usd: f64,
    pub evidence: Vec<String>,
    pub recommendation: String,
    pub risk: String,
    pub eligible_for_action: bool,
}

fn text<'a>(v: &'a Value, key: &str) -> &'a str {
    v.get(key).and_then(Value::as_str).unwrap_or("")
}
fn arr<'a>(v: &'a Value, key: &str) -> &'a [Value] {
    v.get(key)
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}
fn num(v: &Value, key: &str) -> f64 {
    v.get(key).and_then(Value::as_f64).unwrap_or(0.0)
}
fn age_days(then: &str, now: DateTime<Utc>) -> Option<i64> {
    let then = DateTime::parse_from_rfc3339(then).ok()?.with_timezone(&Utc);
    let elapsed = now.signed_duration_since(then).num_seconds();
    (elapsed >= 0).then_some(elapsed / 86_400)
}
fn tagged(v: &Value) -> bool {
    arr(v, "Tags")
        .iter()
        .any(|t| text(t, "Key") == "janitor:managed" && text(t, "Value") == "true")
}
fn rate(v: &Value, key: &str) -> f64 {
    num(&v["rates"], key)
}
fn dollars(n: f64) -> f64 {
    (n * 100.0).round() / 100.0
}
#[allow(clippy::too_many_arguments)]
fn item(
    i: &Value,
    kind: &str,
    id: &str,
    title: &str,
    explanation: String,
    cost: f64,
    evidence: Vec<String>,
    recommendation: &str,
    risk: &str,
    eligible: bool,
) -> Finding {
    Finding {
        id: format!("{kind}:{id}"),
        resource_id: id.into(),
        region: text(i, "region").into(),
        kind: kind.into(),
        title: title.into(),
        explanation,
        estimated_monthly_usd: dollars(cost),
        evidence,
        recommendation: recommendation.into(),
        risk: risk.into(),
        eligible_for_action: eligible,
    }
}
fn complete_below(v: &Value, key: &str, threshold: f64) -> bool {
    let samples = arr(v, key);
    samples.len() == 14
        && samples
            .iter()
            .all(|n| n.as_f64().is_some_and(|n| n.is_finite() && n < threshold))
}
/// Scan one AWS-shaped inventory snapshot. Estimates are fixture assumptions, not proven savings.
/// Missing fields and metric windows suppress findings rather than inventing certainty.
pub fn scan(i: &Value) -> Result<Vec<Finding>, String> {
    let now = DateTime::parse_from_rfc3339(text(i, "capturedAt"))
        .map_err(|_| "capturedAt must be RFC3339".to_string())?
        .with_timezone(&Utc);
    let region = text(i, "region");
    if region.is_empty() {
        return Err("region is required".into());
    }
    let mut out = Vec::new();
    let volumes = arr(&i["volumes"], "Volumes");
    for v in volumes {
        let id = text(v, "VolumeId");
        let size = num(v, "Size");
        let Some(days) = age_days(text(v, "CreateTime"), now) else {
            continue;
        };
        if id.is_empty()
            || size <= 0.0
            || text(v, "State") != "available"
            || !arr(v, "Attachments").is_empty()
            || days < 7
        {
            continue;
        }
        out.push(item(i,"volume",id,"Unattached EBS volume",format!("This {size} GB disk has had no attachment for at least {days} days. It may still hold data."),size*rate(i,"gp3GbMonth"),vec!["State: available".into(),"Attachments: 0".into(),format!("Created: {}",text(v,"CreateTime"))],"Review contents and create a verified backup before considering deletion.","High: deleting a volume can lose data.",false));
    }
    for a in arr(&i["addresses"], "Addresses") {
        let id = text(a, "AllocationId");
        if id.is_empty()
            || ["AssociationId", "NetworkInterfaceId", "InstanceId"]
                .iter()
                .any(|key| !text(a, key).is_empty())
        {
            continue;
        }
        let ip = text(a, "PublicIp");
        out.push(item(i,"ipv4",id,"Unassociated public IPv4 address",format!("This allocated address ({ip}) has no association. Confirm it is not reserved for a future cutover."),730.0*rate(i,"idleIpv4Hour"),vec![format!("IP: {ip}"),"No association, instance, or network interface returned".into()],"Release only after checking DNS and planned failovers.","Medium: release may lose a reserved address.",tagged(a)));
    }
    for reservation in arr(&i["instances"], "Reservations") {
        for inst in arr(reservation, "Instances") {
            let id = text(inst, "InstanceId");
            if id.is_empty()
                || text(&inst["State"], "Name") != "running"
                || !age_days(text(inst, "LaunchTime"), now).is_some_and(|n| n >= 14)
            {
                continue;
            }
            let metrics = &i["metrics"][id];
            if !complete_below(metrics, "cpuDailyPercent", 5.0)
                || !complete_below(metrics, "networkDailyBytes", 100_000.0)
            {
                continue;
            }
            let instance_type = text(inst, "InstanceType");
            out.push(item(i,"instance",id,"Possibly idle EC2 instance",format!("This running {instance_type} server stayed below 5% daily CPU and 100 KB daily network traffic across the 14 sampled days. CPU alone cannot prove it is unused."),730.0*rate(i,"t3MediumHour"),vec!["State: running".into(),"14 daily CPU and network samples below thresholds".into()],"Ask its owner, check jobs and logs, then schedule a reversible stop.","High: stopping may interrupt work; storage charges remain.",false));
        }
    }
    for lb in arr(&i["loadBalancers"], "LoadBalancers") {
        let id = text(lb, "LoadBalancerArn");
        let name = text(lb, "LoadBalancerName");
        if id.is_empty()
            || text(lb, "Type") != "application"
            || !age_days(text(lb, "CreatedTime"), now).is_some_and(|n| n >= 14)
        {
            continue;
        }
        let m = &i["metrics"][name];
        if !complete_below(m, "requestCountDaily", 1.0)
            || m.get("healthyTargets").and_then(Value::as_i64) != Some(0)
        {
            continue;
        }
        out.push(item(i,"load-balancer",id,"Possibly unused load balancer",format!("This load balancer showed zero requests for 14 sampled days and has no healthy targets. Check its listeners and deployment plans before removal."),730.0*rate(i,"albHour"),vec![format!("Name: {name}"),"Zero requests in 14 daily samples".into(),"Zero healthy targets".into()],"Review DNS, listeners, target groups, and ownership.","High: deletion can break future traffic.",false));
    }
    for s in arr(&i["snapshots"], "Snapshots") {
        let id = text(s, "SnapshotId");
        let source = text(s, "VolumeId");
        let size = num(s, "VolumeSize");
        let Some(days) = age_days(text(s, "StartTime"), now) else {
            continue;
        };
        if id.is_empty()
            || size <= 0.0
            || days < 90
            || volumes.iter().any(|v| text(v, "VolumeId") == source)
        {
            continue;
        }
        out.push(item(i,"snapshot",id,"Old snapshot without a current source volume",format!("This snapshot is at least {days} days old and its source volume was not found. That does not make it safe to delete."),size*rate(i,"snapshotGbMonth"),vec![format!("Created: {}",text(s,"StartTime")),format!("Source volume: {}",if source.is_empty(){"unknown"}else{source})],"Check backup policy and restore references before any deletion.","Critical: backup loss may be irreversible.",false));
    }
    out.sort_by(|a, b| b.estimated_monthly_usd.total_cmp(&a.estimated_monthly_usd));
    Ok(out)
}
