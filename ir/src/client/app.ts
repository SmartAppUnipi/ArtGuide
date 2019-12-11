import { LogFormatter } from "./log-formatter";

function find(tailoredText: string, pageResultJson: string) {
    const matches = []
    let i = 0;
    while (i < tailoredText.length) {
        let j = i + 1;
        let match = null;
        while (j < tailoredText.length) {
            const search = tailoredText.substring(i, j);
            if (search == "\n") break;
            const position = pageResultJson.indexOf(search);
            if (position >= 0) {
                match = {
                    start: position,
                    end: position + search.length,
                    text: search
                }
                j++;
            }
            else break;
        }
        if (match) {
            matches.push(match);
            // console.log(match)
            // if match, j is after the first non matching char, restart from before that char
            i = j - 1;
        } else {
            // no match, j is after the char that has not matched, restart form after that char (skip it)
            i = j;
        }
    }

    matches.sort((a, b) => b.start - a.start)
    for (let match of matches) {
        const before = pageResultJson.substring(0, match.start);
        const span = `<span style="color: red">${match.text}</span>`;
        const after = pageResultJson.substring(match.end);
        pageResultJson = before + span + after;
    }

    return pageResultJson;
}


(async () => {
    const irTree = document.getElementById("ir-tree");
    const adaptationTree = document.getElementById("adaptation-tree");

    const rawLogs = await fetch("/logs/raw").then(res => res.json());
    const logFormatter = new LogFormatter(rawLogs);
    const logs = logFormatter.filter();

    const adaptationResponseLogs = logs.filter(l => l.message == "[adaptation.ts] Adaptation text response");
    const last = adaptationResponseLogs?.pop();

    const tailoredText = last?.metadata?.adaptationResponse?.tailoredText ?? "Log not found";
    const pageResults = last?.metadata?.adaptationResponse?.results ?? "Log not found";
    const pageResultJson = JSON.stringify(pageResults, null, 2);

    irTree.innerText = pageResultJson;
    adaptationTree.innerText = tailoredText;

    irTree.innerHTML = find(tailoredText, pageResultJson);
})();

