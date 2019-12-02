import { UserProfile } from './user-profile.model'
import { PageResult } from './page-result.model'


export interface TailoredTextRequest {
    userProfile: UserProfile
    results: Array<PageResult>;
}

export interface TailoredTextResponse {
    userProfile: UserProfile;
    results: Array<PageResult>;
    tailored_text: string;
}
