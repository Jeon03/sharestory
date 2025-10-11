import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../css/SalesPage.module.css';
// ✅ 수정: 필요한 API 함수들을 모두 import
import { createCommunityPost, getCommunityPostDetail, updateCommunityPost } from '../services/communityApi';

const CATEGORIES = ['동네질문', '일상', '맛집', '분실/실종', '동네소식'];

export default function CommunityWrite() {
    const { id } = useParams<{ id: string }>(); // URL에서 id 파라미터를 가져옴
    const isEditMode = Boolean(id); // id가 있으면 수정 모드

    const [category, setCategory] = useState(CATEGORIES[0]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // ✅ 추가: 수정 모드일 때 기존 게시글 데이터를 불러오는 로직
    useEffect(() => {
        if (isEditMode && id) {
            const fetchPostData = async () => {
                try {
                    const post = await getCommunityPostDetail(id);
                    setCategory(post.category);
                    setTitle(post.title);
                    setContent(post.content);
                } catch (error) {
                    console.error(error);
                    alert('게시글 정보를 불러오는데 실패했습니다.');
                    navigate('/community');
                }
            };
            fetchPostData();
        }
    }, [id, isEditMode, navigate]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            const postData = { category, title, content };

            if (isEditMode && id) {
                // 수정 모드일 경우
                await updateCommunityPost(id, postData);
                alert('게시글이 성공적으로 수정되었습니다.');
                navigate(`/community/posts/${id}`); // 수정 후 상세 페이지로 이동
            } else {
                // 생성 모드일 경우
                const newPost = await createCommunityPost(postData);
                alert('게시글이 성공적으로 등록되었습니다.');
                navigate(`/community/posts/${newPost.id}`);
            }
        } catch (error) {
            console.error(error);
            alert(`오류가 발생했습니다: ${isEditMode ? '수정' : '등록'} 실패`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className={styles.saleProduct}>
            {/* ✅ 수정: 제목을 모드에 따라 동적으로 변경 */}
            <h2 className={styles.h2_top}>{isEditMode ? '게시글 수정' : '동네생활 글쓰기'}</h2>
            <hr className={styles.hr_bold} />

            <form onSubmit={handleSubmit}>
                {/* 카테고리, 제목, 내용 입력 폼 (이전과 동일) */}
                <div className={styles.category}>
                    <h4>카테고리</h4>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.categorySelect}>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <hr className={styles.hr} />
                <div className={styles.productName}>
                    <h4>제목</h4>
                    <input maxLength={100} placeholder="제목을 입력해 주세요." value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <hr className={styles.hr} />
                <div className={styles.productExplain}>
                    <h4>내용</h4>
                    <textarea maxLength={2000} placeholder="이웃과 나누고 싶은 이야기를 적어보세요." value={content} onChange={(e) => setContent(e.target.value)} style={{ height: '300px' }} />
                </div>
                <hr className={styles.hr_bold} />
                <div className={styles.submitOption}>
                    {/* ✅ 수정: 버튼 텍스트를 모드에 따라 동적으로 변경 */}
                    <button type="submit" className={styles.submitOptionButton} disabled={isLoading}>
                        {isLoading ? '처리 중...' : (isEditMode ? '수정하기' : '등록하기')}
                    </button>
                </div>
            </form>
        </section>
    );
}