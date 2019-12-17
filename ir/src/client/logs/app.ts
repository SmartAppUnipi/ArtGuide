import { Utils } from "./utils";
import { parse } from "./log-parser";


(async () => {
    // take a reference to left and right divs
    const irTree = document.getElementById("ir-tree");
    const adaptationTree = document.getElementById("adaptation-tree");

    // fetch logs from server
    const logs = await fetch("/logs/raw").then(res => res.json());

    // take the log that contains the tailored text result
    const adaptationResponseLogs = logs.filter(l => l.message == "[adaptation.ts] Adaptation text response");

    // take the last (most recent) since we could have many
    const last = adaptationResponseLogs?.pop();

    // take tailored text
    const tailoredText: string = last?.metadata?.adaptationResponse?.tailoredText ?? "Log not found";
    // take ir results sent to adaptation
    const pageResults = last?.metadata?.adaptationResponse?.results ?? "Log not found";

    // beautify the json as string
    const pageResultJson: string = JSON.stringify(pageResults, null, 2);

    // create the html with the matched text wrapped in a colored span
    const logParsingResult = parse(tailoredText, Utils.escapeHtml(pageResultJson));

    // assign to the left div
    irTree.innerHTML = logParsingResult.html;

    let adaptationHtml = tailoredText;
    // for each match
    for (const span of logParsingResult.spans) {
        // take the text from the start to the char before the match
        const start = adaptationHtml.indexOf(span.text);
        const end = start + span.text.length
        const before = adaptationHtml.substring(0, start);
        const spanHtml = `<span style="color: ${span.color}" id="${span.irSpanId}">${span.text}</span>`;
        // take the text the char after the match to the end
        const after = adaptationHtml.substring(end);
        // recompose the text with the span in the middle
        adaptationHtml = before + spanHtml + after;
    }

    // assign it to the right div
    adaptationTree.innerHTML = adaptationHtml;

    for (const adaptationSpan of document.getElementsByClassName("adaptation-span")) {
        // for each right span (from adaptation tailored text) add a click listsner
        adaptationSpan.addEventListener("click", function (e) {

            // take the corresponding right div to obtain its position
            const currentSpanId = this.getAttribute("data-ir-span-id");
            const span = document.getElementById(currentSpanId);

            // get top and left position 
            const topPos = span.offsetTop - 50;
            const leftPos = span.offsetLeft - 10;

            // scroll the parent div until the right div is visible
            document.getElementById("ir-tree").scrollTop = topPos;
            document.getElementById("ir-tree").scrollLeft = leftPos;
        });
    }
})();