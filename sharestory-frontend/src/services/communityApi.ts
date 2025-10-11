import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface PostData {
    category: string;
    title: string;
    content: string;
}

// (2단계) 새 게시글 생성
export const createCommunityPost = async (postData: PostData) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
    });
    if (!response.ok) throw new Error('게시글 등록에 실패했습니다.');
    return await response.json();
};

// (3단계) 위치 기반 게시글 목록 조회
export const getCommunityPosts = async (location: { lat: number; lon: number }) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts?lat=${location.lat}&lon=${location.lon}`);
    if (!response.ok) throw new Error('게시글 목록을 불러오는데 실패했습니다.');
    return await response.json();
};

// (4단계) 게시글 상세 정보 조회
export const getCommunityPostDetail = async (postId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts/${postId}`);
    if (!response.ok) throw new Error('게시글 상세 정보를 불러오지 못했습니다.');
    return await response.json();
};

// (4단계) 게시글의 댓글 목록 조회
export const getComments = async (postId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts/${postId}/comments`);
    if (!response.ok) throw new Error('댓글을 불러오지 못했습니다.');
    return await response.json();
};

// (4단계) 새 댓글 작성
export const createComment = async (postId: string, content: string) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('댓글 작성에 실패했습니다.');
    return await response.json();
};

// (5단계) 좋아요 토글
export const togglePostLike = async (postId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts/${postId}/like`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('좋아요 처리에 실패했습니다.');
    return await response.json();
};

// (5단계) 게시글 삭제
export const deletePost = async (postId: string) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts/${postId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('게시글 삭제에 실패했습니다.');
};
// ✅ [추가] 게시글 수정
export const updateCommunityPost = async (postId: string, postData: PostData) => {
    const response = await fetchWithAuth(`${API_BASE}/community/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
    });
    if (!response.ok) throw new Error('게시글 수정에 실패했습니다.');
    return await response.json();
};