import { LogFormatter } from "./log-formatter";

function generateId(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getRandomColor() {
    const colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#00B3E6',
        '#E6B333', '#3366E6', '#999966', '#47ef47', '#B34D4D',
        '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
        '#FF99E6', '#FF1A66', '#E6331A', '#33FFCC',
        '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
        '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
        '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
        '#4D8066', '#809980', '#1AFF33', '#999933',
        '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
        '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

    return colorArray[Math.floor(Math.random() * colorArray.length)]
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function find(tailoredText: string, pageResultJson: string) {
    const result: {
        spans: Array<{ irSpanId: string, text: string }>,
        html: string
    } = { spans: [], html: "" };

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
        const spanId = generateId(4);
        const textColor = getRandomColor();
        // for each matched span, keep a reference to its id
        result.spans.push({ irSpanId: spanId, text: match.text });
        const span = `<span style="color: ${textColor}" id="${spanId}" data-color="${textColor}">${match.text}</span>`;
        const after = pageResultJson.substring(match.end);
        pageResultJson = before + span + after;
    }

    result.html = pageResultJson

    return result;
}

(async () => {
    const irTree = document.getElementById("ir-tree");
    const adaptationTree = document.getElementById("adaptation-tree");

    const rawLogs = await fetch("/logs/raw").then(res => res.json());
    const logFormatter = new LogFormatter(rawLogs);
    const logs = logFormatter.filter();

    const adaptationResponseLogs = logs.filter(l => l.message == "[adaptation.ts] Adaptation text response");
    const last = adaptationResponseLogs?.pop();

    const tailoredText: string = last?.metadata?.adaptationResponse?.tailoredText ?? "Log not found";
    const pageResults = last?.metadata?.adaptationResponse?.results ?? "Log not found";
    const pageResultJson: string = JSON.stringify(pageResults, null, 2);


    // create the html with the matched text wrapped in a colored span
    const logParsingResult = find(tailoredText, escapeHtml(pageResultJson));

    // assign to the left div
    irTree.innerHTML = logParsingResult.html;


    // for each matched span, create the corresponding span on the right div
    let adaptationHtml = "";
    for (const span of logParsingResult.spans) {
        // take the color from the attribute set before
        const color = document.getElementById(span.irSpanId).getAttribute("data-color");
        // create the new html string
        adaptationHtml += `<span style="color: ${color}" data-ir-span-id="${span.irSpanId}" class="adaptation-span">${span.text}</span>`;
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