import { PageResult } from "../../src/models";
import { escapeHtml, getRandomColor, generateId } from "../../src/utils";

/**
 * @param tailoredText
 * @param pageResultJson
 */
export function parse(tailoredText: string, pageResults: Array<PageResult>) {

    tailoredText = escapeHtml(tailoredText);

    // create the return object 
    const result: {
        htmlIr: string,
        htmlAdaptation: string
    } = { htmlAdaptation: "", htmlIr: "" };

    let pageResultsJson = escapeHtml(JSON.stringify(pageResults, null, 2))

    const matches: Array<{
        ir: { start: number, end: number },
        adaptation: { start: number, end: number },
        text: string,
        entityId: string,
        color: string,
        spanId: string
    }> = [];

    let i = 0;
    while (i < tailoredText.length) {
        let j = i + 1;
        let match = null;
        while (j <= tailoredText.length) {
            const search = tailoredText.substring(i, j);

            const blackList = ["\n", "\'", "\"", "<", ">", "=", ":", ".", ",", ";"]
            if (blackList.includes(search)) {
                break;
            }

            const position = pageResultsJson.indexOf(search);
            if (position >= 0) {

                const pgMatch = pageResults.find(pg =>
                    escapeHtml(pg?.title).includes(search) ||
                    escapeHtml(pg?.summary).includes(search) ||
                    pg.sections?.some(section =>
                        escapeHtml(section?.title)?.includes(search) ||
                        escapeHtml(section?.content)?.includes(search)
                    )
                );

                match = {
                    text: search,
                    spanId: generateId(8),
                    color: getRandomColor(),
                    ir: {
                        start: position,
                        end: position + search.length
                    },
                    adaptation: {
                        start: i,
                        end: j
                    },

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
    matches.sort((a, b) => b.ir.start - a.ir.start);
    // for each match
    for (const match of matches) {
        // take the text from the start to the char before the match
        const beforeIr = pageResultsJson.substring(0, match.ir.start);
        const spanIr = `<span style="color: ${match.color}" id="${match.spanId}" class="ir-span">${match.text}</span>`;
        // take the text the char after the match to the end
        const afterIr = pageResultsJson.substring(match.ir.end);
        // recompose the text with the span in the middle
        pageResultsJson = beforeIr + spanIr + afterIr;
    }

    // sort matches in revers order to start from the back to not update indices
    matches.sort((a, b) => b.adaptation.start - a.adaptation.start);
    console.log(matches.filter(m => !m.entityId))
    for (const match of matches) {
        const beforeAdaptation = tailoredText.substring(0, match.adaptation.start);
        const spanAdaptation = `<span style="color: ${match.color}" class="adaptation-span" data-color="${match.color}" data-entity-id="${match.entityId}" data-ir-span-id="${match.spanId}">${match.text}</span>`;
        // take the text the char after the match to the end
        const afterAdaptation = tailoredText.substring(match.adaptation.end);
        // recompose the text with the span in the middle
        tailoredText = beforeAdaptation + spanAdaptation + afterAdaptation;
    }

    // set the result
    result.htmlIr = pageResultsJson;
    result.htmlAdaptation = tailoredText;

    return result;
}