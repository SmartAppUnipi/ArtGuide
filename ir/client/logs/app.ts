import { parse } from "./log-parser";
import { Utils } from "./utils";
import { LogLevels, Entity } from "src/models";

interface ILog {
    level: LogLevels;
    message: string;
    metadata: any;
    timestamp: string;
}

(async () => {
    // take a reference to left and right divs
    const irTree = document.getElementById("ir-tree");
    const adaptationTree = document.getElementById("adaptation-tree");
    const classificationTree = document.getElementById("classification-tree");

    // fetch logs from server
    const logs: Array<ILog> = await fetch("/logs/raw").then(res => res.json());

    // take the last (most recent) since we could have many
    const last = logs.filter(l => l.message == "[adaptation.ts] Adaptation text response")?.pop();

    // take tailored text
    const tailoredText: string = last?.metadata?.adaptationResponse?.tailoredText ?? "Log not found";
    // take ir results sent to adaptation
    const pageResults = last?.metadata?.adaptationResponse?.results ?? "Log not found";

    // create the html with the matched text wrapped in a colored span
    const logParsingResult = parse(tailoredText, pageResults);

    // assign to the left div
    irTree.innerHTML = logParsingResult.html;

    let adaptationHtml = tailoredText;
    // for each match
    for (const span of logParsingResult.spans) {
        // take the text from the start to the char before the match
        const start = adaptationHtml.indexOf(span.text);
        const end = start + span.text.length;
        const before = adaptationHtml.substring(0, start);
        const spanHtml = `<span style="color: ${span.color}" class="adaptation-span" data-color="${span.color}" data-ir-span-id="${span.irSpanId}" data-entity-id="${span.entityId}">${span.text}</span>`;
        // take the text the char after the match to the end
        const after = adaptationHtml.substring(end);
        // recompose the text with the span in the middle
        adaptationHtml = before + spanHtml + after;
    }

    // assign it to the right div
    adaptationTree.innerHTML = adaptationHtml;

    // classification tree
    const lastReducedEntities: Array<Entity> = logs
        .filter(l => l.message == "[app.ts] Reduced classification entities and labels.")
        ?.pop()
        ?.metadata
        ?.entities ?? [];

    classificationTree.innerHTML = JSON.stringify(lastReducedEntities);

    for (const adaptationSpan of document.getElementsByClassName("adaptation-span")) {
        // for each right span (from adaptation tailored text) add a click listener
        adaptationSpan.addEventListener("click", function () {

            const currentEntityId: string = this.getAttribute("data-entity-id");
            const currentIrSpanId: string = this.getAttribute("data-ir-span-id");
            const currentColor: string = this.getAttribute("data-color");

            // populate classification
            let classificationHtml = Utils.escapeHtml(JSON.stringify(lastReducedEntities));
            const start = classificationHtml.indexOf(currentEntityId);
            const end = start + currentEntityId.length;
            const before = classificationHtml.substring(0, start);
            const spanHtml = `<span style="color: ${currentColor}" class="classification-span" id="${currentEntityId}">${currentEntityId}</span>`;
            const after = classificationHtml.substring(end);
            classificationHtml = before + spanHtml + after;
            classificationTree.innerHTML = classificationHtml;

            scrollUntilVisible("classification-tree", currentEntityId);
            scrollUntilVisible("ir-tree", currentIrSpanId);
        });
    }
    printResponseTime(logs);
})();

function scrollUntilVisible(scrollableContainerId: string, targetToShowId: string, topExtraOffset = -50, leftExtraOffset = -10) {
    // take the corresponding target to obtain its position
    const target = document.getElementById(targetToShowId);

    // get top and left position 
    const topPos = target.offsetTop + topExtraOffset;
    const leftPos = target.offsetLeft + leftExtraOffset;

    // scroll the parent div until the right div is visible
    document.getElementById(scrollableContainerId).scrollTop = topPos;
    document.getElementById(scrollableContainerId).scrollLeft = leftPos;
}

function printResponseTime(logs: Array<ILog>) {

    const totalResponseTimeSpan = document.getElementById("total-response-time");
    const partialResponseTimeSpan = document.getElementById("partial-response-time");
    const adaptationResponseTimeSpan = document.getElementById("adaptation-response-time");

    const first = logs?.filter(l => l.message == "[app.ts] Post request received.")?.pop();
    const beforeAdaptation = logs?.filter(l => l.message == "[adaptation.ts] Adaptation text request")?.pop();
    const last = logs?.filter(l => l.message == "[adaptation.ts] Adaptation text response")?.pop();

    const totalResponseTime = (new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) / 1000;
    const partialResponseTime = (new Date(beforeAdaptation.timestamp).getTime() - new Date(first.timestamp).getTime()) / 1000;

    partialResponseTimeSpan.innerText = `${partialResponseTime} secs`;
    adaptationResponseTimeSpan.innerText = `${totalResponseTime - partialResponseTime} secs`;
    totalResponseTimeSpan.innerText = `${totalResponseTime} secs`;


}