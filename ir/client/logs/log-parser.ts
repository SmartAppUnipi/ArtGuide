import { Utils } from "./utils";
import { PageResult } from "src/models";

/**
 * @param tailoredText
 * @param pageResultJson
 */
export function parse(tailoredText: string, pageResults: Array<PageResult>) {

    // create the return object 
    const result: {
        spans: Array<{ irSpanId: string; text: string; color: string, entityId: string }>;
        html: string;
    } = { spans: [], html: "" };

    let pageResultsJson = Utils.escapeHtml(JSON.stringify(pageResults))

    const matches: Array<{ start: number, end: number, text: string, entityId: string }> = [];
    let i = 0;
    while (i < tailoredText.length) {
        let j = i + 1;
        let match = null;
        while (j <= tailoredText.length) {
            const search = tailoredText.substring(i, j);
            if (search == "\n") {
                j++;
                continue;
            }
            const position = pageResultsJson.indexOf(search);
            if (position >= 0) {

                const pgMatch = pageResults.find(pg =>
                    pg.title.includes(search) ||
                    pg.summary?.includes(search) ||
                    pg.sections?.some(section =>
                        section.title?.includes(search) ||
                        section.content?.includes(search)
                    )
                );

                match = {
                    start: position,
                    end: position + search.length,
                    text: search,
                    entityId: pgMatch?.entityId
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
        const before = pageResultsJson.substring(0, match.start);
        const spanId = Utils.generateId(8);
        const color = Utils.getRandomColor();
        // for each matched span, keep a reference to its id
        result.spans.push({ irSpanId: spanId, text: match.text, color, entityId: match.entityId });
        const span = `<span style="color: ${color}" id="${spanId}" class="ir-span">${match.text}</span>`;
        // take the text the char after the match to the end
        const after = pageResultsJson.substring(match.end);
        // recompose the text with the span in the middle
        pageResultsJson = before + span + after;
    }

    // set the result
    result.html = pageResultsJson;

    return result;
}