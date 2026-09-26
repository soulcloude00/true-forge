import {inventoryFor,scenarios,type Scenario} from './scenarios.ts';
import {scan,type Finding} from './scanner.ts';
export type ScenarioComparison={scenario:Scenario;title:string;count:number;monthlyCandidateUsd:number;resourceIds:string[]};
/** Separate synthetic inventories; not a forecast or a change to the current scan. */
export function compareScenarios():ScenarioComparison[]{
 return (Object.keys(scenarios) as Scenario[]).map(scenario=>{
  const findings:Finding[]=scan(inventoryFor(scenario));
  return {scenario,title:scenarios[scenario].title,count:findings.length,monthlyCandidateUsd:Math.round(findings.reduce((n,f)=>n+f.estimatedMonthlyUsd,0)*100)/100,resourceIds:findings.map(f=>f.resourceId)};
 });
}
