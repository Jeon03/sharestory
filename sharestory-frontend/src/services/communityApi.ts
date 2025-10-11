import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface PostData {
    category: string;
    title: string;
    content: string;
}

// For creating new posts
export const createCommunityPost = async (postData: PostData, image?: File | null) => {
    const formData = new FormData();
    formData.append('post', new Blob([JSON.stringify(postData)], { type: "application/json" }));
    if (image) {
        formData.append('image', image);
    }
    const response = await fetchWithAuth(`${API_BASE}/community/posts`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error('Failed to create post.');
    return await response.json();
};

// For updating existing posts
export const updateCommunityPost = async (postId: string, postData: PostData, image?: File | null) => {
    const formData = new FormData();
    formData.append('post', new Blob([JSON.stringify(postData)], { type: "application/json" }));
    if (image) {
        formData.append('image', image);
    }
    const response = await fetchWithAuth(`${API_BASE}/community/posts/${postId}`, {
        method: 'PUT',
        body: formData,
    });
    if (!response.ok) throw new Error('Failed to update post.');
    return await response.json();
};

// For fetching posts by location
export const getCommunityPosts = async (location: { lat: number; lon: number }, category?: string) => {
    let url = `${API_BASE}/community/posts?lat=${location.lat}&lon=${location.lon}`;
    if (category && category !== '전체보기') {
        url += `&category=${encodeURIComponent(category)}`;
    }
    const response = await fetchWithAuth(url);
    if (!response.ok) throw new Error('Failed to fetch posts.');
    return await response.json();
};

// For fetching a single post's details
export const getCommunityPostDetail = async (postId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts/${postId}`);
    if (!response.ok) throw new Error('Failed to fetch post details.');
    return await response.json();
};

// For fetching comments for a post
export const getComments = async (postId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts/${postId}/comments`);
    if (!response.ok) throw new Error('Failed to fetch comments.');
    return await response.json();
};

// ✅ **This is the missing function**
export const createComment = async (postId: string, content: string) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to create comment.');
    return await response.json();
};

// For toggling a post like
export const togglePostLike = async (postId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts/${postId}/like`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to process like.');
    return await response.json();
};

// For deleting a post
export const deletePost = async (postId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts/${postId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete post.');
};