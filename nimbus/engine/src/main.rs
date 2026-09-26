use janitor_engine::scan;
use serde_json::{json, Value};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Explicit fixture path. Never loads AWS credentials or calls an AWS service.
    let inventory: Value = serde_json::from_str(include_str!("../fixtures/inventory.json"))?;
    let findings = scan(&inventory)?;
    println!(
        "{}",
        serde_json::to_string_pretty(
            &json!({"source":"SYNTHETIC FIXTURE - NOT A REAL AWS ACCOUNT","findings":findings})
        )?
    );
    Ok(())
}
