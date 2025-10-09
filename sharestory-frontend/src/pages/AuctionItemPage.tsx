// import { useMemo, useState, useEffect } from 'react';
// import { Link, useNavigate, useParams } from 'react-router-dom';
// import type { CustomArrowProps, Settings } from 'react-slick';
// import Slider from 'react-slick';
// import '../css/AuctionItemPage.css';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { Heart } from 'lucide-react';
// import ChatSlider from '../components/chat/ChatSlider.tsx';
//
// type ItemStatus =
//     | 'ON_SALE'
//     | 'RESERVED'
//     | 'SOLD_OUT'
//     | 'SAFE_DELIVERY'
//     | 'SAFE_DELIVERY_START'
//     | 'SAFE_DELIVERY_ING'
//     | 'SAFE_DELIVERY_COMPLETE'
//     | 'SAFE_DELIVERY_POINT_DONE';
//
// type ShippingOption = 'included' | 'separate';
//
// interface DealInfo {
//     parcel?: boolean;
//     direct?: boolean;
//     auction?: boolean;
//     safeTrade?: boolean;
//     shippingOption?: ShippingOption;
// }
//
// interface ItemDetail {
//     id: number;
//     userId: number;
//     title: string;
//     price: number;
//     description: string;
//     category: string;
//     createdDate: string;
//     itemStatus: ItemStatus;
//     condition: string;
//     status?: string;
//     imageUrl?: string;
//     images?: string[];
//     dealInfo?: DealInfo;
//     modified?: boolean;
//     updatedDate?: string;
// }
//
// interface User {
//     id: number;
//     name: string;
//     email: string;
//     points: number;
// }
//
// function PrevArrow({ className, style, onClick }: CustomArrowProps) {
//     return <div className={className} style={{ ...style, display: 'block', left: 20, zIndex: 1 }} onClick={onClick} />;
// }
//
// function NextArrow({ className, style, onClick }: CustomArrowProps) {
//     return <div className={className} style={{ ...style, display: 'block', right: 20, zIndex: 1 }} onClick={onClick} />;
// }
//
// /** ✅ 경매 팝업 모달 */
// function AuctionModal({
//                           isOpen,
//                           onClose,
//                           itemTitle,
//                           currentUserPoints,
//                           highestBid,
//                           bidUnit,
//                           endTime,
//                           onBidSuccess,
//                       }: {
//     isOpen: boolean;
//     onClose: () => void;
//     itemTitle: string;
//     currentUserPoints: number;
//     highestBid: number;
//     bidUnit: number;
//     endTime: Date;
//     onBidSuccess: (newBid: number) => void;
// }) {
//     const [bidAmount, setBidAmount] = useState(highestBid + bidUnit);
//     const [timeLeft, setTimeLeft] = useState('');
//
//     // ⏰ 실시간 남은 시간 업데이트
//     useEffect(() => {
//         const timer = setInterval(() => {
//             const diff = endTime.getTime() - new Date().getTime();
//             if (diff <= 0) {
//                 setTimeLeft('경매 종료');
//                 clearInterval(timer);
//             } else {
//                 const h = Math.floor(diff / (1000 * 60 * 60));
//                 const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//                 const s = Math.floor((diff % (1000 * 60)) / 1000);
//                 setTimeLeft(`${h}시간 ${m}분 ${s}초`);
//             }
//         }, 1000);
//
//         return () => clearInterval(timer);
//     }, [endTime]);
//
//     if (!isOpen) return null;
//
//     const handleBid = () => {
//         const amount = Number(bidAmount);
//
//         if (amount <= highestBid) {
//             alert(`현재 최고 입찰가(${highestBid.toLocaleString()}원)보다 높은 금액을 입력해야 합니다.`);
//             return;
//         }
//         if (amount > currentUserPoints) {
//             alert(`보유 포인트(${currentUserPoints.toLocaleString()}P)를 초과할 수 없습니다.`);
//             return;
//         }
//         if ((amount - highestBid) % bidUnit !== 0) {
//             alert(`입찰은 ${bidUnit.toLocaleString()}원 단위로만 가능합니다.`);
//             return;
//         }
//
//         alert(`💰 ${amount.toLocaleString()}원으로 입찰 완료! (더미 동작)`);
//         onBidSuccess(amount); // ✅ 최고 입찰가 업데이트
//         onClose();
//     };
//
//     return (
//         <div className="auction-modal-overlay">
//             <div className="auction-modal">
//                 <h2>📢 {itemTitle} 경매 참여</h2>
//                 <p>현재 최고 입찰가: <b>{highestBid.toLocaleString()}원</b></p>
//                 <p>보유 포인트: <b>{currentUserPoints.toLocaleString()}P</b></p>
//                 <p>입찰 단위: <b>{bidUnit.toLocaleString()}원</b></p>
//                 <p>남은 시간: <b>{timeLeft}</b></p>
//
//                 <input
//                     type="number"
//                     value={bidAmount}
//                     min={highestBid + bidUnit}
//                     max={currentUserPoints}
//                     step={bidUnit}   // 🔥 화살표 클릭 시 단위 증가/감소
//                     onChange={(e) => setBidAmount(Number(e.target.value))}
//                 />
//                 <div className="btn-group">
//                     <button onClick={onClose} className="btn-cancel">취소</button>
//                     <button onClick={handleBid} className="btn-confirm">입찰하기</button>
//                 </div>
//             </div>
//         </div>
//     );
// }
//
// export default function AuctionItemPage() {
//     const { id } = useParams();
//     const navigate = useNavigate();
//
//     const [item] = useState<ItemDetail>({
//         id: 1,
//         userId: 100,
//         title: "🎧 소니 무선 헤드폰 WH-1000XM5",
//         price: 350000,
//         description: "최신형 소니 노이즈캔슬링 헤드폰입니다.\n상태는 거의 새 제품과 같습니다.\n직거래, 택배거래 모두 가능해요!",
//         category: "전자기기 > 오디오",
//         createdDate: "2025-09-20T12:00:00",
//         itemStatus: "ON_SALE",
//         condition: "거의 새 것",
//         images: [
//             "https://via.placeholder.com/600x400?text=상품이미지1",
//             "https://via.placeholder.com/600x400?text=상품이미지2",
//             "https://via.placeholder.com/600x400?text=상품이미지3",
//         ],
//         dealInfo: {
//             parcel: false,
//             direct: false,
//             auction: true,
//             safeTrade: false,
//         },
//         modified: true,
//         updatedDate: "2025-09-21T09:00:00",
//     });
//
//     // ✅ 로그인 사용자 (더미)
//     const [currentUser] = useState<User>({
//         id: 200,
//         name: "김철수",
//         email: "test2@example.com",
//         points: 500000,
//     });
//
//     // ✅ 경매 관련 더미 데이터
//     const [highestBid, setHighestBid] = useState(300000);
//     const bidUnit = 1000;
//     const endTime = new Date(new Date().getTime() + 1000 * 60 * 60 * 2);
//
//     const [isFavorite, setIsFavorite] = useState(false);
//     const [favoriteCount, setFavoriteCount] = useState(12);
//     const [showChat, setShowChat] = useState(false);
//     const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
//     const [showAuctionModal, setShowAuctionModal] = useState(false);
//
//     const toggleFavorite = () => {
//         setIsFavorite(!isFavorite);
//         setFavoriteCount(prev => (isFavorite ? prev - 1 : prev + 1));
//     };
//
//     const handleDelete = () => {
//         if (!window.confirm('정말로 이 상품을 삭제하시겠습니까?')) return;
//         alert('상품이 삭제되었습니다. (더미)');
//         navigate('/');
//     };
//
//     const handleStartChat = () => {
//         setActiveRoomId(1);
//         setShowChat(true);
//     };
//
//     const images = useMemo(() => {
//         if (!item) return [] as string[];
//         const arr = item.images && item.images.length > 0 ? item.images : item.imageUrl ? [item.imageUrl] : [];
//         return arr.filter(Boolean) as string[];
//     }, [item]);
//
//     const sliderSettings: Settings = {
//         dots: true,
//         infinite: true,
//         autoplay: true,
//         autoplaySpeed: 3000,
//         pauseOnHover: true,
//         speed: 500,
//         slidesToShow: 1,
//         slidesToScroll: 1,
//         arrows: true,
//         prevArrow: <PrevArrow />,
//         nextArrow: <NextArrow />,
//         adaptiveHeight: true,
//         responsive: [{ breakpoint: 768, settings: { arrows: false, dots: true } }],
//     };
//
//     if (!item) return <div className="detail-loading">데이터가 없습니다.</div>;
//
//     return (
//         <div className="detail-container">
//             <nav className="breadcrumb">
//                 <Link to="/">홈</Link> &gt; <Link to="/category">{item.category}</Link> &gt; <span>{item.title}</span>
//             </nav>
//
//             <div className="detail-main">
//                 <div className="detail-slider">
//                     {images.length > 0 ? (
//                         <Slider {...sliderSettings}>
//                             {images.map((url, idx) => (
//                                 <div key={idx} className="image-wrapper">
//                                     <img src={url} alt={`${item.title} ${idx + 1}`} className="slide-image" />
//                                 </div>
//                             ))}
//                         </Slider>
//                     ) : (
//                         <div className="image-wrapper">
//                             <div className="slide-image no-image">이미지가 없습니다</div>
//                         </div>
//                     )}
//                 </div>
//
//                 <div className="detail-info">
//                     <h1 className="detail-title">{item.title}</h1>
//
//                     <div className="detail-meta-top">
//                         <span className="category">{item.category}</span>
//                         <span> · </span>
//                         <span className="time">
//                             {new Date(item.createdDate).toLocaleString()}
//                             {item.modified && (
//                                 <span style={{ marginLeft: "6px", color: "#888", fontSize: "0.9em" }}>(수정됨)</span>
//                             )}
//                         </span>
//                     </div>
//
//                     <p className="detail-price">{item.price.toLocaleString()}원</p>
//
//                     <button onClick={toggleFavorite} className="favorite-btn">
//                         {isFavorite ? <Heart fill="red" stroke="red" size={24} /> : <Heart stroke="gray" size={24} />}
//                         <span style={{ marginLeft: 6 }}>{favoriteCount}</span>
//                     </button>
//
//                     <div className="detail-description">
//                         {(item.description || '').split('\n').map((line, i) => (
//                             <p key={i}>{line}</p>
//                         ))}
//                     </div>
//
//                     <table className="detail-table">
//                         <tbody>
//                         <tr>
//                             <th>상품상태</th>
//                             <td>{item.condition ?? '-'}</td>
//                         </tr>
//                         <tr>
//                             <th>거래방식</th>
//                             <td>
//                                 {[
//                                     item.dealInfo?.parcel && '택배거래',
//                                     item.dealInfo?.direct && '직거래',
//                                     item.dealInfo?.auction && (
//                                         <button
//                                             key="auction-btn"
//                                             onClick={() => setShowAuctionModal(true)}
//                                             className="auction-btn"
//                                         >
//                                             물품경매
//                                         </button>
//                                     ),
//                                     item.dealInfo?.safeTrade && '🔒안전거래',
//                                     item.dealInfo?.shippingOption &&
//                                     `(배송비: ${item.dealInfo.shippingOption === 'included' ? '포함' : '별도'})`,
//                                 ]
//                                     .filter(Boolean)
//                                     .map((val, idx, arr) => (
//                                         <span key={idx}>
//                                             {val}
//                                             {idx < arr.length - 1 && ' · '}
//                                         </span>
//                                     ))}
//                             </td>
//                         </tr>
//                         <tr>
//                             <th>현재 최고 입찰가</th>
//                             <td><b>{highestBid.toLocaleString()}원</b></td>
//                         </tr>
//                         </tbody>
//                     </table>
//
//                     <button onClick={handleStartChat} className="chat-btn bg-blue-500 text-white px-4 py-2 rounded mt-4">
//                         💬 채팅하기
//                     </button>
//
//                     {currentUser && item.userId === currentUser.id && (
//                         <div className="owner-actions">
//                             <button className="edit-btn" onClick={() => navigate(`/items/${item.id}/edit`)}>
//                                 수정하기
//                             </button>
//                             <button className="delete-btn" onClick={handleDelete}>
//                                 삭제하기
//                             </button>
//                         </div>
//                     )}
//                 </div>
//             </div>
//
//             <ChatSlider isOpen={showChat} onClose={() => setShowChat(false)} activeRoomId={activeRoomId} />
//
//             <AuctionModal
//                 isOpen={showAuctionModal}
//                 onClose={() => setShowAuctionModal(false)}
//                 itemTitle={item.title}
//                 currentUserPoints={currentUser.points}
//                 highestBid={highestBid}
//                 bidUnit={bidUnit}
//                 endTime={endTime}
//                 onBidSuccess={(newBid) => setHighestBid(newBid)} // ✅ 최고 입찰가 업데이트
//             />
//         </div>
//     );
// }
