import { Utils } from "./utils";

/**
 * @param tailoredText
 * @param pageResultJson
 */
export function parse(tailoredText: string, pageResultJson: string) {

    // create the return object 
    const result: {
        spans: Array<{ irSpanId: string; text: string; color: string }>;
        html: string;
    } = { spans: [], html: "" };

    const matches = [];
    let i = 0;
    while (i < tailoredText.length) {
        let j = i + 1;
        let match = null;
        while (j <= tailoredText.length) {
            const search = tailoredText.substring(i, j);
            if (search == "\n") break;
            const position = pageResultJson.indexOf(search);
            if (position >= 0) {
                match = {
                    start: position,
                    end: position + search.length,
                    text: search
                };
                j++;
            } else break;
        }
        if (match) {
            matches.push(match);
            /*
             * console.log(match)
             * if match, j is after the first non matching char, restart from before that char
             */
            i = j - 1;
        } else {
            // no match, j is after the char that has not matched, restart form after that char (skip it)
            i = j;
        }
    }

    // sort matches in revers order to start from the back to not update indices
    matches.sort((a, b) => b.start - a.start);

    // for each match
    for (const match of matches) {
        // take the text from the start to the char before the match
        const before = pageResultJson.substring(0, match.start);
        const spanId = Utils.generateId(4);
        const color = Utils.getRandomColor();
        // for each matched span, keep a reference to its id
        result.spans.push({ irSpanId: spanId, text: match.text, color });
        const span = `<span style="color: ${color}" id="${spanId}" class="ir-span">${match.text}</span>`;
        // take the text the char after the match to the end
        const after = pageResultJson.substring(match.end);
        // recompose the text with the span in the middle
        pageResultJson = before + span + after;
    }

    // set the result
    result.html = pageResultJson;

    return result;
}