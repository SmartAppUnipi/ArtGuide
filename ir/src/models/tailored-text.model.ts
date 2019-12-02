import { PageResult } from "./page-result.model";
import { UserProfile } from "./user-profile.model";


export interface TailoredTextRequest {
    userProfile: UserProfile;
    results: Array<PageResult>;
}

export interface TailoredTextResponse {
    userProfile: UserProfile;
    results: Array<PageResult>;
    tailored_text: string;
}
