export interface UserProfile {
    id: number;
    tastes: Array<string>;
    language: string;
    expertiseLevel: ExpertizeLevelType;
}

export enum ExpertizeLevelType {
    Child = 1,
    Novice = 2,
    Knowledgeable = 3,
    Expert = 4
}