import { useMemo } from 'react';
import Slider from 'react-slick';
import type { CustomArrowProps, Settings } from 'react-slick';
import type { ItemDetail } from '../../types/auction';

// 슬라이더 화살표 컴포넌트
function PrevArrow({ className, style, onClick }: CustomArrowProps) {
    return <div className={className} style={{ ...style, display: 'block', left: 20, zIndex: 1 }} onClick={onClick} />;
}
function NextArrow({ className, style, onClick }: CustomArrowProps) {
    return <div className={className} style={{ ...style, display: 'block', right: 20, zIndex: 1 }} onClick={onClick} />;
}

interface ItemImageSliderProps {
    item: ItemDetail;
}

export function ItemImageSlider({ item }: ItemImageSliderProps) {
    const images = useMemo(() => {
        if (Array.isArray(item.images) && item.images.length > 0) {
            return item.images.map(img => img.url);
        }
        return item.imageUrl ? [item.imageUrl] : [];
    }, [item]);

    const sliderSettings: Settings = {
        dots: true,
        infinite: images.length > 1,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        prevArrow: <PrevArrow />,
        nextArrow: <NextArrow />,
    };

    return (
        <div className="detail-slider">
            {images.length > 0 ? (
                <Slider {...sliderSettings}>
                    {images.map((url, idx) => (
                        <div key={idx} className="image-wrapper">
                            <img src={url} alt={`${item.title} ${idx + 1}`} className="slide-image" />
                        </div>
                    ))}
                </Slider>
            ) : (
                <div className="image-wrapper">
                    <div className="slide-image no-image">이미지가 없습니다</div>
                </div>
            )}
        </div>
    );
}