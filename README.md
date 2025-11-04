# 프로젝트 ShareStory

**중고거래 · 커뮤니티 · 경매를 하나로 통합한 플랫폼**  

![ShareStory 로고](./images/logo.png)

## 📙 프로젝트 개요
**ShareStory**는 ‘공유(Share)’와 ‘이야기(Story)’를 결합한 플랫폼으로,  
단순한 중고거래를 넘어 **소통·신뢰·참여**를 중심으로 한 거래 환경을 제공합니다.

<img width="1920" height="1080" alt="슬라이드4" src="https://github.com/user-attachments/assets/cf9af3c6-529a-4abb-8e43-73b85ccb1cf8" />

## ✏️ 프로젝트 소개
<img width="1920" height="1080" alt="슬라이드6" src="https://github.com/user-attachments/assets/d1a1fe32-299d-4852-95b0-8c96ac851dd7" />


## 🙍‍♂️ 팀 멤버 소개

| **전여욱** | **김준성** | **김신성** | **주현서** |
|:-------------------:|:------------------:|:----------------------:|:-------------------:|
| <img src="https://github.com/user-attachments/assets/71fcfb03-2be4-4b31-9e97-a3ad7c2fb9da" width="150"/> <br/> [@JeonYeoUk](https://github.com/Jeon03) | <img src="https://github.com/user-attachments/assets/71fcfb03-2be4-4b31-9e97-a3ad7c2fb9da" width="150"/> <br/> [@김준성](https://github.com/Kimjunesung96) | <img src="https://github.com/user-attachments/assets/71fcfb03-2be4-4b31-9e97-a3ad7c2fb9da" width="150"/> <br/> [@김신성](https://github.com/qederd) | <img src="https://github.com/user-attachments/assets/71fcfb03-2be4-4b31-9e97-a3ad7c2fb9da" width="150"/> <br/> [@주현서](https://github.com/) |
| 팀장 / 풀스택 | 백엔드 | 프론트엔드 | 백엔드 |

## ⚙️ 개발 환경

- **Front-end**:  
  <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" height="25"/>  
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" height="25"/>

- **Back-end**:  
  <img src="https://img.shields.io/badge/Spring%20Boot-6DB33F?style=flat&logo=spring-boot&logoColor=white" height="25"/>  
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white" height="25"/>  
  <img src="https://img.shields.io/badge/FCM-4285F4?style=flat&logo=firebase&logoColor=white" height="25"/>

- **Database / Storage**:  
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white" height="25"/>  
  <img src="https://img.shields.io/badge/AWS%20S3-569A31?style=flat&logo=amazon-aws&logoColor=white" height="25"/>  
  <img src="https://img.shields.io/badge/Elasticsearch-005571?style=flat&logo=elasticsearch&logoColor=white" height="25"/>

- **Infra / 배포**:  
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white" height="25"/>  
  <img src="https://img.shields.io/badge/Amazon%20EC2-FF9900?style=flat&logo=amazon-aws&logoColor=white" height="25"/>  
  <img src="https://img.shields.io/badge/Nginx-009639?style=flat&logo=nginx&logoColor=white" height="25"/>

- **협업 / 디자인**:  
  <img src="https://img.shields.io/badge/Notion-000000?style=flat&logo=notion&logoColor=white" height="25"/>  
  <img src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white" height="25"/>  
  <img src="https://img.shields.io/badge/Discord-5865F2?style=flat&logo=discord&logoColor=white" height="25"/>  
  <img src="https://img.shields.io/badge/Figma-F24E1E?style=flat&logo=figma&logoColor=white" height="25"/>


## 프로젝트 

### 시스템 구성도
<img width="1920" height="1080" alt="슬라이드13" src="https://github.com/user-attachments/assets/50c67af7-3883-425f-8816-fbd7c3fc2098" />
<img width="1920" height="1080" alt="슬라이드16" src="https://github.com/user-attachments/assets/e023dcc9-5e4e-4d2f-8013-f94982def73d" />

### ERD
<img width="1920" height="1080" alt="슬라이드14" src="https://github.com/user-attachments/assets/3a715bae-63a9-4f55-9826-044a2d8a91dc" />

## 🚀 **주요 기능 (Core Features)**

### 🛒 중고거래 (Marketplace)
- **상품 등록 / 수정 / 삭제**
  - AWS S3 이미지 업로드 및 미리보기
  - 카카오 지도 API 기반 위치 좌표 저장
  - 거래 방식: 직거래 / 택배 / 안전거래
- **상품 검색**
  - Elasticsearch 기반 **위치 + 키워드 검색**
  - `search_as_you_type` + `nori tokenizer` 기반 **자동완성(titleSuggest)** 기능
- **상품 정렬 / 필터**
  - 최신순 / 조회순 / 관심순 / 전체상품 정렬
- **안전거래 (에스크로 포인트 결제)**
  - 💰 모든 거래는 **포인트로만 결제**
  - 사용자는 먼저 **아임포트(PortOne)** 를 통해 포인트를 충전
  - 거래 시 포인트가 **에스크로(보류)** 상태로 전환
  - 송장 등록 → 배송 시작(MockScheduler) → 수령 완료 시  
    **포인트 자동 정산 (판매자에게 지급)**
  - 마이페이지에서 **충전 / 사용 / 정산 내역 관리 가능**
- **조회수 중복 방지**
  - 로그인 / 비로그인 사용자 모두 일정시간 내 중복 조회 제한 (Redis 기반)
---

### 🔍 **검색 기능 (Search System — Elasticsearch 기반)**
- **Elasticsearch 8.x 기반 통합 검색 시스템**  
  - 단일 인덱스(`items`)에서 **키워드, 자동완성, 위치 기반 검색** 모두 처리  
  - `nori_tokenizer`로 한글 형태소 분석  
  - `edge_ngram_filter`로 부분 검색 지원  
  - `search_as_you_type`으로 실시간 자동완성 제공  
  - `geo_point` 필드로 반경 검색 및 거리순 정렬  
- **서비스 구성**
  - `ItemSearchService`: 키워드 + 위치 검색  
  - `ItemAutocompleteService`: 자동완성  
  - `ItemSyncService`: MySQL → Elasticsearch 동기화
- **위치 기반 검색**
  - 상품 등록 시 위도·경도(`geo_point`) 저장  
  - `geo_distance` 쿼리로 반경 내 상품 검색 및 **거리순 정렬**  
- **키워드 & 자동완성**
  - `search_as_you_type` 필드로 입력 중 실시간 제안  
  - “아이” 입력 → “아이폰”, “아이패드” 자동 추천  
  - 부분 검색(`edge_ngram`)으로 단어 일부만 입력해도 검색 가능  
- 프론트엔드: React 검색창 입력 → 자동완성 표시 → 거리순 결과 정렬  

> 💡 **요약:**  
> 한글 형태소 분석 + 자동완성 + 거리 기반 검색을 통합한  
> **Elasticsearch 기반 고급 검색 시스템**

---

### 💸 **포인트 시스템 (Point System)**
- 아임포트(PortOne) 연동 포인트 충전  
- 안전거래 결제시 포인트 차감 → 수령 완료 후 정산  
- 충전 / 사용 / 지급 내역 관리  
- 마이페이지에서 포인트 정산 내역 확인가능

---

### 💬 **실시간 채팅 (Real-time Chat)**
- WebSocket + STOMP 기반 실시간 메시지 전송  
- 메시지 읽음 처리 및 상태 표시  
- 채팅방 목록 슬라이드 UI  
- 채팅 도착 시 FCM 푸시 알림  
- 거래 발생 시 자동 채팅방 생성  

---

### 🔔 **알림 시스템 (Notification System)**
- **Context 전역 알림 관리** (읽음/안읽음, 실시간 상태 유지)  
- **WebSocket 알림:** 거래·채팅·포인트 이벤트 실시간 전달  
- **FCM 푸시 알림:** 백엔드 이벤트 → 웹/모바일 알림 발송  
- **이메일 알림:** 송장 등록, 수령 요청, 포인트 지급  
- **문자 알림(CoolSMS):** 주요 거래 상태 전송  

---

### 🧠 **AI 기능 (AI-Powered Features)**
- GPT API 기반 **상품 제목 → 카테고리 자동 추천**  
- 등록 시 추천 결과를 폼에 자동 반영  

---

### 📰 커뮤니티 기능 (Local Community)
- **내 동네 기반 커뮤니티**
  - 사용자가 마이페이지에서 **내 동네(행정동 단위)** 설정  
  - “동네생활” 탭에서는 **내가 설정한 지역의 게시글만 표시**
  - 게시글 등록 시 작성자의 동네 정보 자동 저장
- **게시글 관리**
  - 카테고리별 게시판  
  - 게시글 작성, 삭제  
  - **사진 첨부 및 동네 정보 표시**
- **댓글 / 대댓글 (Nested Reply)**
  - 댓글 등록 및 삭제 가능
- **상호작용 기능**
  - 좋아요(공감) 기능

---

### 💰 **경매 (Auction System)**
- **경매 상품 등록**
  - 판매자가 상품 등록 시 경매 시작가, 즉시구매가, 마감 시간 설정 가능  
- **실시간 입찰 (가격 자동 갱신)**
  - WebSocket 기반 실시간 입찰 갱신  
  - 현재 최고 입찰가 및 참여자 수 입찰내역에 출력
  - 입찰 시 보유보인트에서 선 차감 후, 종료 시 환불 처리
- **즉시구매 (Buy Now)**
  - 즉시구매가로 결제 시 경매 즉시 종료 및 낙찰 처리
- **입찰 취소 제한**
  - 입찰 1건 이상 발생 시 판매자는 경매 취소 불가
- **낙찰 처리**
  - 마감 시간 도래 시 자동으로 최고가 입찰자 **낙찰 확정**  
  - 낙찰 즉시 낙찰자의 포인트가 **에스크로(보류)** 상태로 전환
- **안전거래 프로세스 연동**
  - 낙찰 이후 일반 거래와 동일한 **안전거래 절차 진행**  
  - 송장 등록 → 배송 시작(MockScheduler) → 수령 완료 →  
    **포인트 자동 정산 (판매자에게 지급)**
  - 모든 거래 내역은 마이페이지에서 확인 가능
- **경매 전용 알림 시스템**
  - 입찰 발생 시 판매자에게 **실시간 WebSocket 알림 + FCM 푸시 전송**
  - 즉시구매 시 판매자와 모든 입찰자에게 알림 발송 (경매 종료 안내)
  - 경매 종료(낙찰) 시 판매자와 낙찰자 모두에게 **낙찰 알림** 전달
  - 모든 알림은 Context 전역 알림 시스템과 연동되어  
    실시간으로 표시 및 읽음 상태 반영
- **경매 내역 관리**
  - 마이페이지에서 진행 중 경매, 낙찰 내역, 정산 상태 등을 조회 가능

---

### 👤 **회원 및 마이페이지 (User & MyPage)**
- **회원 인증**
  - 소셜 로그인 (Google / Naver / Kakao OAuth2)  
  - 로그인 시 Spring Security + JWT + HttpOnly 쿠키 기반 인증  
  - 로그인 후 FCM 토큰 자동 등록 (푸시 알림 연동)
- **회원 정보 관리**
  - 프로필 정보 및 내 동네 설정 가능
  - 내 동네 설정으로 위치기반 검색 가능
  - 내 동네 설정 시 “동네생활” 커뮤니티 게시글 자동 필터링
- **포인트 관리**
  - 포인트 충전 / 사용 / 지급 / 정산 내역 통합 관리  
- **거래 내역 관리**
  - 판매 내역, 구매 내역, 안전거래(에스크로) 내역 조회 가능  
- **경매 내역 관리**
  - 내가 등록한 경매 / 참여한 입찰 내역 / 낙찰 내역 확인  
  - 낙찰 후 안전거래 프로세스 진행 상태 확인 가능
- **관심상품 (찜)**
  - 우측 슬라이드 패널 UI로 구성  
  - 등록/삭제 시 즉시 반영, 상세 페이지로 바로 이동 가능
- **알림 / 채팅 통합 관리**
  - Context 전역 알림 시스템과 연동되어  
    채팅, 포인트, 거래 이벤트를 실시간으로 확인  
  - 읽음/안읽음 상태 및 FCM 푸시 연동 

---

> 💡 **요약:**  
> ShareStory는 **포인트 기반 안전거래**,  
> **실시간 채팅 + 전역 알림**,  
> **AI 카테고리 추천**,  
> **내 동네 커뮤니티**,  
> **Elasticsearch 기반 통합 검색**  
> 기능을 갖춘 **올인원 중고거래 플랫폼**입니다.



## 사용자별 기능
<img width="1920" height="1080" alt="슬라이드8" src="https://github.com/user-attachments/assets/54e4c95b-87cf-49f9-8e44-700b5f02adcc" />

## 프로젝트 계획서 ppt

[📄 프로젝트 계획서 PPT ](https://github.com/Jeon03/sharestory/blob/main/%EC%89%90%EC%96%B4%ED%86%A0%EB%A6%AC(ShareStory)%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%EA%B3%84%ED%9A%8D%EC%84%9C%20PPT.pptx)

## 프로젝트 최종 발표 ppt

<img width="1920" height="1080" alt="슬라이드1" src="https://github.com/user-attachments/assets/b9cb5b55-560e-416a-ad32-f9803108330a" />

[📊 최종 발표 PPT ](https://github.com/Jeon03/sharestory/blob/main/%EC%89%90%EC%96%B4%ED%86%A0%EB%A6%AC(ShareStory)%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%EC%B5%9C%EC%A2%85%20%EB%B0%9C%ED%91%9C%20PPT.pptx)


## 시연 영상

<img width="1440" height="857" alt="2323232323" src="https://github.com/user-attachments/assets/899d50f9-25fb-4a77-85e8-509daef5d0b4" />

[YouTube 영상](https://www.youtube.com/watch?v=VoXTd5blJgY)
