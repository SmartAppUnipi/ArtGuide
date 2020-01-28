import path from "path"
import { CacheService } from "../search";
import { Router } from "express"
import { TailoredTextResponse, Validation, VoteCount } from "../models";

const router = Router()

router.post("/", (req, res) => {
    const { requestId, sentenceId, validation } = req.body;
    const dbValidationService = new CacheService(path.join("db", "ir-validation-db.json"));

    const key = `${requestId}-${sentenceId}`;

    const validationObj = {
        key,
        date: new Date(),
        sentenceId,
        requestId,
        validation
    }

    dbValidationService.set(key, validationObj);

    return res.json(validationObj);
});


router.get("/", async (req, res) => {

    const dbService = new CacheService(path.join("db", "ir-requests-db.json"));
    const dbValidationService = new CacheService(path.join("db", "ir-validation-db.json"));

    const userIdValidation = new Map<number, VoteCount>();
    const languageValidation = new Map<string, VoteCount>();
    const expertiseLevelValidation = new Map<number, VoteCount>();
    const userTasteValidation = new Map<string, VoteCount>();
    const urlValidation = new Map<string, VoteCount>();
    const domainValidation = new Map<string, VoteCount>();
    const scoreValidation = new Map<string, VoteCount>();

    for (const validationRecord of dbValidationService.getAll<Validation>()) {
        const response = dbService.get<TailoredTextResponse>(validationRecord.requestId);
        const validation = response?.validation.find(val => val.sentenceId == validationRecord.sentenceId);
        const isKnownInstance = !!response.knownInstance;

        // userId
        const userId = response?.userProfile.id
        const userIdCount = userIdValidation.get(userId) ?? new VoteCount();
        userIdCount.addScore(validationRecord.validation, isKnownInstance);
        userIdValidation.set(userId, userIdCount);

        // language
        const language = response?.userProfile.language
        const languageCount = languageValidation.get(language) ?? new VoteCount();
        languageCount.addScore(validationRecord.validation, isKnownInstance);
        languageValidation.set(language, languageCount);

        // expertiseLevel
        const expertiseLevel = response?.userProfile.expertiseLevel
        const expertiseLevelCount = expertiseLevelValidation.get(expertiseLevel) ?? new VoteCount();
        expertiseLevelCount.addScore(validationRecord.validation, isKnownInstance);
        expertiseLevelValidation.set(expertiseLevel, expertiseLevelCount);

        // taste
        response?.userProfile.tastes.forEach(t => {
            const userTasteCount = userTasteValidation.get(t) ?? new VoteCount();
            userTasteCount.addScore(validationRecord.validation, isKnownInstance);
            userTasteValidation.set(t, userTasteCount);
        });

        // url
        if (validation) {
            const url = validation.matchingPageResult.url;
            const urlCount = urlValidation.get(url) ?? new VoteCount();
            urlCount.addScore(validationRecord.validation, isKnownInstance);
            urlValidation.set(url, urlCount);
        }

        // domain
        if (validation) {
            const domain = new URL(validation.matchingPageResult.url).hostname;
            const domainCount = domainValidation.get(domain) ?? new VoteCount();
            domainCount.addScore(validationRecord.validation, isKnownInstance);
            domainValidation.set(domain, domainCount);
        }

        // score
        const scoreThreshold = 0.8;
        if (validation) {
            const score = (validation.matchingPageResult.score >= scoreThreshold ? ">=" : "<") + scoreThreshold;
            const scoreCount = scoreValidation.get(score) ?? new VoteCount();
            scoreCount.addScore(validationRecord.validation, isKnownInstance);
            scoreValidation.set(score, scoreCount);
        }
    }

    // knownInstance
    const knownInstanceCount = {
        known: {
            positive: 0,
            negative: 0,
            get average() { return (this.positive - this.negative) / (this.positive + this.negative) || 0 }
        },
        unknown: {
            positive: 0,
            negative: 0,
            get average() { return (this.positive - this.negative) / (this.positive + this.negative) || 0 }
        }
    }
    for (const [key, value] of userIdValidation.entries()) {
        // known
        knownInstanceCount.known.positive += value.positiveKnownInstance;
        knownInstanceCount.known.negative += value.negativeKnownInstance;
        // unknown
        knownInstanceCount.unknown.positive += value.positiveUnknownInstance;
        knownInstanceCount.unknown.negative += value.negativeUnknownInstance;
    }


    const mapToObj = (m: Map<any, VoteCount>) => {
        return Array.from(m).reduce((obj, [key, value]) => {
            obj[key] = {
                average: value.average,
                negative: value.negative,
                positive: value.positive,
                averageKnownInstance: value.averageKnownInstance,
                averageUnknownInstance: value.averageUnknownInstance,
                ...value
            } as VoteCount;
            return obj;
        }, {});
    };

    return res.json({
        userIdValidation: mapToObj(userIdValidation),
        languageValidation: mapToObj(languageValidation),
        expertiseLevelValidation: mapToObj(expertiseLevelValidation),
        userTasteValidation: mapToObj(userTasteValidation),
        urlValidation: mapToObj(urlValidation),
        domainValidation: mapToObj(domainValidation),
        scoreValidation: mapToObj(scoreValidation),
        knownInstanceValidation: {
            known: {
                average: knownInstanceCount.known.average,
                ...knownInstanceCount.known
            },
            unknown: {
                average: knownInstanceCount.unknown.average,
                ...knownInstanceCount.unknown
            }
        }
    });

});

export default router;