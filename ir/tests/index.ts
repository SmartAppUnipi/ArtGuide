import { UserProfile, ExpertizeLevelType } from "../src/models";


export const userProfiles = {
    en: {
        expert: {
            expertiseLevel: ExpertizeLevelType.Expert,
            language: "en",
            tastes: ["history"]
        } as UserProfile,
        kid: {
            expertiseLevel: ExpertizeLevelType.Child,
            language: "en",
            tastes: ["history"]
        } as UserProfile
    },
    it: {
        expert: {
            expertiseLevel: ExpertizeLevelType.Expert,
            language: "it",
            tastes: ["storia"]
        } as UserProfile,
        kid: {
            expertiseLevel: ExpertizeLevelType.Child,
            language: "it",
            tastes: ["storia"]
        } as UserProfile
    }
};