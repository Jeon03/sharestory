import { useNavigate } from "react-router-dom";
import styles from '../css/Category.module.css';

// ✅ Props 타입 정의
type CategoryProps = {
    selectedCategory: string;
    setSelectedCategory?: (key: string) => void;
    enableNavigation?: boolean;
};

function Category({ selectedCategory, setSelectedCategory, enableNavigation = true }: CategoryProps) {
    const navigate = useNavigate();

    const categories = [
        { key: 'digital', label: '디지털기기' },
        { key: 'appliance', label: '생활가전' },
        { key: 'furniture', label: '가구/인테리어' },
        { key: 'living_kitchen', label: '생활/주방' },
        { key: 'kids', label: '유아동' },
        { key: 'kids_books', label: '유아도서' },
        { key: 'womens_clothing', label: '여성의류' },
        { key: 'womens_accessories', label: '여성잡화' },
        { key: 'mens_fashion', label: '남성패션/잡화' },
        { key: 'beauty', label: '뷰티/미용' },
        { key: 'sports', label: '스포츠/레저' },
        { key: 'hobby', label: '취미/게임/음반' },
        { key: 'books', label: '도서' },
        { key: 'ticket', label: '티켓/교환권' },
        { key: 'processed_food', label: '가공식품' },
        { key: 'health', label: '건강기능식품' },
        { key: 'pet', label: '반려동물용품' },
        { key: 'plant', label: '식물' },
        { key: 'others', label: '기타 중고물품' },
        { key: 'buying', label: '삽니다' }
    ];

    const handleClick = (key: string) => {
        setSelectedCategory?.(key); // ✅ 선택 상태 설정
        if (enableNavigation) {
            navigate(`/category/${key}`); // ✅ 페이지 이동은 옵션
        }
    };

    return (
        <div className={styles.categoryContainer}>
            <ul className={styles.categorySection}>
                {categories.map(({ key, label }) => (
                    <li
                        key={key}
                        onClick={() => handleClick(key)}
                        className={selectedCategory === key ? styles.selected : ''}
                    >
                        {label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Category;
