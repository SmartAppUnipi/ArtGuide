import { Utils } from "./utils";

/**
 * @param tailoredText
 * @param pageResultJson
 */
export function parse(tailoredText: string, pageResultJson: string) {

    // create the return object 
    const result: {
        htmlIr: string,
        htmlAdaptation: string
    } = { htmlAdaptation: "", htmlIr: "" };

    const matches = [];
    let i = 0;
    while (i < tailoredText.length) {
        let j = i + 1;
        let match = null;
        while (j <= tailoredText.length) {
            const search = tailoredText.substring(i, j);

            const blackList = ["\n", "\'", "\"", "<", ">", "=", ":", ".", ",", ";"]
            if (blackList.includes(search)){
                break;
            }

            const position = pageResultJson.indexOf(search);
            if (position >= 0) {
                match = {
                    text: search,
                    spanId: Utils.generateId(8),
                    color: Utils.getRandomColor(),
                    ir: {
                        start: position,
                        end: position + search.length
                    },
                    adaptation: {
                        start: i,
                        end: j
                    }
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
        const beforeIr = pageResultJson.substring(0, match.ir.start);
        const spanIr = `<span style="color: ${match.color}" id="${match.spanId}" class="ir-span">${match.text}</span>`;
        // take the text the char after the match to the end
        const afterIr = pageResultJson.substring(match.ir.end);
        // recompose the text with the span in the middle
        pageResultJson = beforeIr + spanIr + afterIr;
    }

    // sort matches in revers order to start from the back to not update indices
    matches.sort((a, b) => b.adaptation.start - a.adaptation.start);
    console.log(matches)
    for (const match of matches) {
        const beforeAdaptation = tailoredText.substring(0, match.adaptation.start);
        const spanAdaptation = `<span style="color: ${match.color}" class="adaptation-span" data-ir-span-id="${match.spanId}">${match.text}</span>`;
        // take the text the char after the match to the end
        const afterAdaptation = tailoredText.substring(match.adaptation.end);
        // recompose the text with the span in the middle
        tailoredText = beforeAdaptation + spanAdaptation + afterAdaptation;
    }

    // set the result
    result.htmlIr = pageResultJson;
    result.htmlAdaptation = tailoredText;

    return result;
}