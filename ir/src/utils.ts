import * as childProcess from "child_process";
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
 * Return the last commit hash on the local repository
 */
export function getLastCommitHash() {
    const latestCommit = childProcess
        .execSync("git rev-parse HEAD")
        .toString()
        .replace(/\n/, "");

    return latestCommit;
}