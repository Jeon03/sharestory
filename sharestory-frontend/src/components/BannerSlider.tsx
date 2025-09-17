import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import '../css/list.css';

// @ts-expect-error swiper css has no type declarations
import 'swiper/css';
// @ts-expect-error swiper css has no type declarations
import 'swiper/css/pagination';


import img1 from "../../public/banner.png";
import img2 from "../../public/banner.png";
import img3 from "../../public/banner.png";

export default function BannerSlider() {
    return (
        <div className="banner-slider">
            <Swiper
                modules={[Autoplay, Pagination]}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                loop={true}
            >
                <SwiperSlide>
                    <img src={img1} alt="배너1" className="banner-image" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src={img2} alt="배너2" className="banner-image" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src={img3} alt="배너3" className="banner-image" />
                </SwiperSlide>
            </Swiper>
        </div>
    );
}
