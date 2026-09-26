# Source ledger (September 26, 2026)
- IBM/Kubecost, Allocations Dashboard, https://www.ibm.com/docs/en/kubecost/self-hosted/3.x?topic=ui-allocations-dashboard . Official documentation; Kubernetes allocation by workload constructs. Inspiration for cost segmentation, not a Nimbus implementation claim.
- Infracost, FinOps policies, https://www.infracost.io/docs/infracost_cloud/finops_policies/ . Official docs; cost governance and code-change policies.
- Infracost, Cost guardrails, https://www.infracost.io/docs/infracost_cloud/guardrails/ . Official docs; pre-deployment cost guardrails. Nimbus has no CI integration.
- Vantage, Budgets, https://docs.vantage.sh/budgets . Official docs; budgets attach to cost reports and can track service/team. Inspiration for sample target analysis.
- CloudZero, Anomaly Detection, https://docs.cloudzero.com/docs/anomaly-detection . Official docs; monitor spend and detect cost changes. Nimbus lacks time-series bill data, so cannot honestly implement anomaly detection yet.
- CAST AI, Kubernetes Optimization, https://cast.ai/kubernetes-cost-optimization/ . Official product page; Kubernetes efficiency/rightsizing, beyond current AWS fixture scope.
- AWS, Rightsizing, https://docs.aws.amazon.com/cost-management/latest/userguide/ce-rightsizing.html . Primary documentation; recommendation context. Nimbus has only conservative idle leads, not instance-type rightsizing.
- AWS, Cost Anomaly Detection, https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html . Primary documentation; anomaly monitoring. Requires real spend history, not offered by fixture.
- Spot, Eco reports, https://spot.io/product/eco-reports/ . Official product page; commitment reporting, outside fixture scope.
