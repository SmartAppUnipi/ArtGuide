import { LogFormatter } from "./log-formatter";
import { PageResult } from "../models";

function find(search: string, pageResults: Array<PageResult>) {
  const matchedPageResult = pageResults.find(pageResult => {
    return pageResult?.summary?.indexOf(search)
  });
}

(async () => {
  const irTree = document.getElementById("ir-tree")
  const adaptationTree = document.getElementById("adaptation-tree")

  const rawLogs = await fetch("/logs/raw").then(res => res.json())
  const logFormatter = new LogFormatter(rawLogs)
  const logs = logFormatter.filter()

  const adaptationResponseLogs = logs.filter(l => l.message == "[adaptation.ts] Adaptation text response");
  const last = adaptationResponseLogs?.pop();
  
  const tailoredText = last?.metadata?.adaptationResponse?.tailoredText ?? "Log not found";
  const pageResults = last?.metadata?.adaptationResponse?.results ?? "Log not found";

  irTree.innerText = JSON.stringify(pageResults, null, 2);
  adaptationTree.innerText = tailoredText;
})()

