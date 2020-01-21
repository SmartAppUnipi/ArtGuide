import { Entity } from "./models";


/**
 * Reduce the number of entities by cutting on the biggest jump between scores.
 *
 * @param entities The list of entities.
 * @param maxEntityNumber A limit to the number of entities to be kept. Default is all.
 * @param minScore A minimum score to keep the entity. Default is 0, ie. no min score.
 * @returns The list of survived entities.
 */
export function reduceEntities(entities: Array<Entity>,
    maxEntityNumber = entities ? entities.length : 0, minScore = 0): Array<Entity> {

    if (!entities) return null;
    if (!maxEntityNumber && maxEntityNumber !== 0 || maxEntityNumber < 0) maxEntityNumber = entities.length;
    if (!minScore || minScore < 0) minScore = 0;

    let maxGap = 0;
    let cutIndex = 0;

    for (let i = 0; i < entities.length - 1; i++) {
        // stop if the score is too low
        if (entities[i]?.score < minScore)
            break;
        // find the biggest gap
        const gap = entities[i]?.score - entities[i + 1]?.score;
        if (gap > maxGap) {
            maxGap = gap;
            cutIndex = i + 1;   // cut after this item
        }
    }

    return entities
        // cut according to the calculated jump
        .slice(0, cutIndex)
        // slice ensure there are not more than maxEntityNumber entities
        .slice(0, maxEntityNumber);
}

/**
 * Generate a random identifier
 * 
 * @param length The length of the generated id
 */
export function generateId(length: number) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * charactersLength));

    return result;
}

/**
 * Get a random HEX color
 */
export function getRandomColor() {
    const colorArray = ["#FF6633", "#FFB399", "#FF33FF", "#00B3E6",
        "#E6B333", "#3366E6", "#999966", "#47ef47", "#B34D4D",
        "#80B300", "#809900", "#E6B3B3", "#6680B3", "#66991A",
        "#FF99E6", "#FF1A66", "#E6331A", "#33FFCC",
        "#66994D", "#B366CC", "#4D8000", "#B33300", "#CC80CC",
        "#66664D", "#991AFF", "#E666FF", "#4DB3FF", "#1AB399",
        "#E666B3", "#33991A", "#CC9999", "#B3B31A", "#00E680",
        "#4D8066", "#809980", "#1AFF33", "#999933",
        "#FF3380", "#CCCC00", "#66E64D", "#4D80CC", "#9900B3",
        "#E64D66", "#4DB380", "#FF4D4D", "#99E6E6", "#6666FF"];

    return colorArray[Math.floor(Math.random() * colorArray.length)];
}

/**
 * Sanitize unsafe HTML
 * 
 * @param unsafe The HTML to sanitize
 */
export function escapeHtml(unsafe: string) {

    if (!unsafe)
        return "";

    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\\\"/g, "&#039;")
        .replace(/'/g, "&#039;");
}