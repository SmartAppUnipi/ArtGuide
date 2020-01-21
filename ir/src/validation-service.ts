import { PageResult, TailoredTextResponse } from "./models";
import { escapeHtml, generateId, getRandomColor } from "./utils";
import { text } from "body-parser";

interface Metadata {
    sentenceId: string;
    text: string;
    matchingPageResult: PageResult;
}

/**
 * @param tailoredText
 * @param pageResultJson
 */
export function appendValidation(tailoredTextResult: TailoredTextResponse) {

    let tailoredText = escapeHtml(tailoredTextResult.tailoredText);

    // create the return object 
    const sentences: Array<Metadata> = [];

    let pageResultsJson = escapeHtml(JSON.stringify(tailoredTextResult.results, null, 2))

    let i = 0;
    while (i < tailoredText.length) {
        let j = i + 1;
        let match: Metadata = null;
        while (j <= tailoredText.length) {
            const search = tailoredText.substring(i, j);

            const blackList = ["\n", "\'", "\"", "<", ">", "=", ":", ".", ",", ";"]
            if (blackList.includes(search)) {
                break;
            }

            const position = pageResultsJson.indexOf(search);
            if (position >= 0) {

                const pgMatch: PageResult = JSON.parse(JSON.stringify(tailoredTextResult.results.find(pg =>
                    escapeHtml(pg?.title).includes(search) ||
                    escapeHtml(pg?.summary).includes(search) ||
                    pg.sections?.some(section =>
                        escapeHtml(section?.title)?.includes(search) ||
                        escapeHtml(section?.content)?.includes(search)
                    )
                ) ?? null));

                // filter out section not containing the sentence
                pgMatch.sections = pgMatch.sections.filter(sec => sec.title.includes(search) || sec.content.includes(search));

                if (search.length > 15) {
                    match = {
                        text: search,
                        sentenceId: generateId(8),
                        matchingPageResult: pgMatch
                    };
                } else { 
                    match = {
                        text: search,
                        sentenceId: null,
                        matchingPageResult: null
                    };
                }
                j++;
            } else break;
        }
        if (match) {
            sentences.push(match);
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

    return { ...tailoredTextResult, validation: sentences };
}