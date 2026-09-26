use janitor_engine::scan;
use serde_json::{json, Value};
fn fixture() -> Value {
    serde_json::from_str(include_str!("../fixtures/inventory.json")).unwrap()
}
#[test]
fn five_traced_and_priced() {
    let found = scan(&fixture()).unwrap();
    assert_eq!(found.len(), 5);
    assert_eq!(found.iter().filter(|f| f.eligible_for_action).count(), 1);
    assert!(found.iter().all(|f| !f.evidence.is_empty()
        && f.estimated_monthly_usd > 0.0
        && f.region == "us-east-1"));
    assert!(found
        .windows(2)
        .all(|pair| pair[0].estimated_monthly_usd >= pair[1].estimated_monthly_usd));
}
#[test]
fn incomplete_metrics_do_not_claim_idle() {
    let mut i = fixture();
    i["metrics"]["i-0idle"]["cpuDailyPercent"] = json!([1]);
    assert!(!scan(&i).unwrap().iter().any(|f| f.resource_id == "i-0idle"));
}
#[test]
fn activity_suppresses_finding() {
    let mut i = fixture();
    i["addresses"]["Addresses"][0]["AssociationId"] = json!("eipassoc-test");
    i["metrics"]["idle"]["requestCountDaily"][0] = json!(10);
    assert!(!scan(&i)
        .unwrap()
        .iter()
        .any(|f| f.kind == "ipv4" || f.kind == "load-balancer"));
}
#[test]
fn invalid_time_rejected_and_destructive_not_eligible() {
    let mut i = fixture();
    i["capturedAt"] = json!("not-a-date");
    assert!(scan(&i).is_err());
    assert!(scan(&fixture())
        .unwrap()
        .iter()
        .filter(|f| f.kind != "ipv4")
        .all(|f| !f.eligible_for_action));
}
