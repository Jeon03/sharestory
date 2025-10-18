export interface CommunityPost {
    id: number;

    title: string;
    content: string;
    imageUrls: string[];

    latitude?: number;
    longitude?: number;
    authorId?: number;
    postLatitude?: number;
    postLongitude?: number;

    locationName?: string;

    authorName: string;
    authorEmail?: string;
    category: string;
    likeCount: number;
    viewCount: number;
    createdAt: string;
    commentCount: number;

    liked: boolean;
}