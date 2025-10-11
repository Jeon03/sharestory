import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../css/SalesPage.module.css';
import { createCommunityPost, getCommunityPostDetail, updateCommunityPost } from '../services/communityApi';

const CATEGORIES = ['동네질문', '일상', '맛집', '분실/실종', '동네소식'];

export default function CommunityWrite() {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);

    const [category, setCategory] = useState(CATEGORIES[0]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // ✅ 이미지 상태 분리: 새로 추가된 파일, 기존 이미지 URL, 새 미리보기 URL
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 수정 모드일 때 기존 데이터 불러오기
    useEffect(() => {
        if (isEditMode && id) {
            const fetchPostData = async () => {
                try {
                    const post = await getCommunityPostDetail(id);
                    setCategory(post.category);
                    setTitle(post.title);
                    setContent(post.content);
                    if (post.imageUrl) {
                        setExistingImageUrl(post.imageUrl);
                    }
                } catch (error) {
                    console.error(error);
                    alert('게시글 정보를 불러오는데 실패했습니다.');
                    navigate('/community');
                }
            };
            fetchPostData();
        }
    }, [id, isEditMode, navigate]);

    // 새로 선택된 이미지 파일에 대한 미리보기 생성
    useEffect(() => {
        if (!imageFile) {
            setPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setExistingImageUrl(null); // 새 파일 선택 시 기존 이미지는 보이지 않게 처리
        }
    };

    const handleImageRemove = () => {
        setImageFile(null);
        setExistingImageUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // input 초기화
        }
    };

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
                await updateCommunityPost(id, postData, imageFile);
                alert('게시글이 성공적으로 수정되었습니다.');
                navigate(`/community/posts/${id}`);
            } else {
                const newPost = await createCommunityPost(postData, imageFile);
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

    // 화면에 표시할 최종 이미지 소스 결정
    const displayImage = preview || existingImageUrl;

    return (
        <section className={styles.saleProduct}>
            <h2 className={styles.h2_top}>{isEditMode ? '게시글 수정' : '동네생활 글쓰기'}</h2>
            <hr className={styles.hr_bold} />

            <form onSubmit={handleSubmit}>
                <div className={styles.productImage}>
                    <h4>대표 이미지 (선택)</h4>
                    <div className={styles.previewGrid}>
                        <input id="image-input" type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                        {displayImage ? (
                            <div className={styles.previewItem}>
                                <img src={displayImage} alt="미리보기" className={styles.userimg} />
                                <button type="button" className={styles.removeBtn} onClick={handleImageRemove}>✕</button>
                            </div>
                        ) : (
                            <label htmlFor="image-input" className={styles.uploadTile}>
                                <span>이미지등록<br />+</span>
                            </label>
                        )}
                    </div>
                </div>
                <hr className={styles.hr} />

                {/* ... (카테고리, 제목, 내용 폼) ... */}
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
                    <button type="submit" className={styles.submitOptionButton} disabled={isLoading}>
                        {isLoading ? '처리 중...' : (isEditMode ? '수정하기' : '등록하기')}
                    </button>
                </div>
            </form>
        </section>
    );
}